#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::process::{Command, Stdio};
use tauri::Manager;

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      // Resolve paths inside the packaged app
      let resolver = app.path_resolver();

      // Where DB and uploads live
      let app_data_dir: PathBuf = resolver
        .app_data_dir()
        .unwrap_or(std::env::current_dir().unwrap());

      // Static frontend directory
      let public_dir: PathBuf = resolver
        .resolve_resource("../public")
        .unwrap_or_else(|| PathBuf::from("public"));

      // Backend directory
      let backend_dir: PathBuf = resolver
        .resolve_resource("../Backend")
        .unwrap_or_else(|| PathBuf::from("Backend"));

      // Preflight: ensure Node.js is installed and reachable on PATH
      let node_ok = Command::new("node")
        .arg("--version")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status();

      if node_ok.is_err() {
        tauri::api::dialog::message(
          None::<&tauri::Window>,
          "Node.js required",
          "This application requires Node.js to be installed on your system.\n\nPlease install Node.js from https://nodejs.org and try again.",
        );
        return Err(anyhow::anyhow!("Node.js not found on PATH"));
      }

      // Spawn system Node to run our Express server
      // Requires Node to be installed on the target machine
      let mut cmd = Command::new("node");
      cmd.current_dir(&backend_dir)
        .arg("server.js")
        .env("PORT", "4001")
        .env("PUBLIC_DIR", &public_dir)
        .env("APP_DATA_DIR", &app_data_dir)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

      if let Err(e) = cmd.spawn() {
        tauri::api::dialog::message(
          None::<&tauri::Window>,
          "Backend failed to start",
          &format!(
            "Failed to start backend server with system Node.js.\n\nError: {}\n\nMake sure Node.js is installed and available in PATH.",
            e
          ),
        );
        return Err(anyhow::anyhow!(e));
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
