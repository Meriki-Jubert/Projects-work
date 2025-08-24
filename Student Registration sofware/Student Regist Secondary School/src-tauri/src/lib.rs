use tauri::Manager;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  use std::{process::{Child, Command, Stdio}, sync::Mutex};

  struct AppState {
    backend: Mutex<Option<Child>>,
  }

  // Try to find project root by walking up from the executable directory
  fn find_project_root() -> Option<std::path::PathBuf> {
    let mut cur = std::env::current_exe().ok()?.parent()?.to_path_buf();
    for _ in 0..6 {
      let pkg = cur.join("package.json");
      let idx = cur.join("public").join("index.html");
      if pkg.exists() && idx.exists() {
        return Some(cur);
      }
      if let Some(parent) = cur.parent() {
        cur = parent.to_path_buf();
      } else {
        break;
      }
    }
    None
  }

  tauri::Builder::default()
    .setup(|app| {
      // Logging in dev
      if cfg!(debug_assertions) {
        app
          .handle()
          .plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())?;
      }

      // Manage state to keep track of the backend child process
      app.manage(AppState {
        backend: Mutex::new(None),
      });

      // Resolve paths
      let resource_node = app
        .path()
        .resolve("node.exe", tauri::path::BaseDirectory::Resource)
        .ok();
      let resource_backend = app
        .path()
        .resolve("Backend/server.js", tauri::path::BaseDirectory::Resource)
        .ok();
      let resource_public = app
        .path()
        .resolve("public", tauri::path::BaseDirectory::Resource)
        .ok();

      // Determine node executable and backend script
      let (node_exec, backend_script, working_dir, public_dir, app_data_dir) = if cfg!(debug_assertions) {
        // Dev: resolve project root even when double-clicking app.exe
        let project_root = find_project_root()
          .or_else(|| std::env::current_dir().ok())
          .unwrap_or_else(|| std::path::PathBuf::from("."));
        let node_path = project_root.join("node.exe");
        let node_exec = if node_path.exists() {
          node_path
        } else {
          std::path::PathBuf::from("node") // requires Node in PATH
        };
        let backend_script = project_root.join("Backend").join("server.js");
        let public_dir = project_root.join("public");
        // Use OS-specific app data dir for writable files
        let app_data_dir = app.path().app_data_dir().unwrap_or(project_root.clone());
        if !app_data_dir.exists() { let _ = std::fs::create_dir_all(&app_data_dir); }
        (node_exec, backend_script, project_root, public_dir, app_data_dir)
      } else {
        // Production: use bundled resources
        let node_exec = resource_node
          .clone()
          .unwrap_or_else(|| std::path::PathBuf::from("node.exe"));
        let backend_script = resource_backend
          .clone()
          .unwrap_or_else(|| std::path::PathBuf::from("Backend/server.js"));
        let working_dir = backend_script
          .parent()
          .map(|p| p.to_path_buf())
          .unwrap_or_else(|| std::path::PathBuf::from("."));
        let public_dir = resource_public
          .clone()
          .unwrap_or_else(|| working_dir.join("public"));
        let app_data_dir = app.path().app_data_dir().unwrap_or(working_dir.clone());
        if !app_data_dir.exists() { let _ = std::fs::create_dir_all(&app_data_dir); }
        (node_exec, backend_script, working_dir, public_dir, app_data_dir)
      };

      // If a service is already running the backend on 127.0.0.1:4001, skip spawning
      let service_running = std::net::TcpStream::connect("127.0.0.1:4001").is_ok();

      // Spawn backend only if not already running
      let mut maybe_child: Option<Child> = None;
      if !service_running {
        let mut cmd = Command::new(node_exec.clone());
        // Help Node resolve modules: prefer Backend/node_modules (working_dir/node_modules)
        let node_path_env = working_dir.join("node_modules");
        match cmd
          .arg(backend_script.clone())
          .current_dir(working_dir.clone())
          .env("PUBLIC_DIR", public_dir.clone())
          .env("APP_DATA_DIR", app_data_dir.clone())
          .env("PORT", "4001")
          .env("NODE_PATH", node_path_env)
          .stdin(Stdio::null())
          .stdout(Stdio::piped())
          .stderr(Stdio::piped())
          .spawn() {
            Ok(ch) => { maybe_child = Some(ch); },
            Err(e) => { eprintln!("Failed to start backend: {}", e); }
          }
      }

      if service_running || maybe_child.is_some() {
        let mut spawned_stdout = maybe_child.as_mut().and_then(|c| c.stdout.take());
        let mut spawned_stderr = maybe_child.as_mut().and_then(|c| c.stderr.take());
        let handle = app.handle().clone();

        // Capture stdout/stderr to logs (only if we spawned)
        if let Some(mut stdout) = spawned_stdout.take() {
          let log_path = app.path().app_data_dir().unwrap_or(std::env::temp_dir()).join("backend-out.log");
          std::thread::spawn(move || {
            use std::io::{Read, Write};
            let mut file = std::fs::File::create(log_path).ok();
            let mut buf = [0u8; 8192];
            loop {
              match stdout.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => { if let Some(f) = file.as_mut() { let _ = f.write_all(&buf[..n]); } },
                Err(_) => break,
              }
            }
          });
        }
        if let Some(mut stderr) = spawned_stderr.take() {
          let err_path = app.path().app_data_dir().unwrap_or(std::env::temp_dir()).join("backend-err.log");
          std::thread::spawn(move || {
            use std::io::{Read, Write};
            let mut file = std::fs::File::create(err_path).ok();
            let mut buf = [0u8; 8192];
            loop {
              match stderr.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => { if let Some(f) = file.as_mut() { let _ = f.write_all(&buf[..n]); } },
                Err(_) => break,
              }
            }
          });
        }

        // Wait for backend to be ready on 127.0.0.1:4001 then navigate
        std::thread::spawn(move || {
            use std::{net::TcpStream, time::Duration, thread::sleep};
            for _ in 0..100 { // up to ~10s
              if TcpStream::connect("127.0.0.1:4001").is_ok() {
                if let Some(win) = handle.get_webview_window("main") {
                  if let Ok(url) = tauri::Url::parse("http://127.0.0.1:4001/") {
                    let _ = win.navigate(url);
                  }
                }
                break;
              }
              sleep(Duration::from_millis(100));
            }
        });

        // Store child after setting up pipes if we actually spawned one
        if let Some(ch) = maybe_child {
          if let Some(state) = app.try_state::<AppState>() {
            *state.backend.lock().unwrap() = Some(ch);
          }
        }
      }

      // Ensure backend is killed when the main window is closed
      let app_handle = app.handle();
      if let Some(win) = app_handle.get_webview_window("main") {
        let app_handle_clone = app_handle.clone();
        win.on_window_event(move |event| {
          if let tauri::WindowEvent::CloseRequested { .. } = event {
            if let Some(state) = app_handle_clone.try_state::<AppState>() {
              if let Some(mut ch) = state.backend.lock().unwrap().take() {
                let _ = ch.kill();
              }
            }
          }
        });
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
