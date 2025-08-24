!macro customInstall
  DetailPrint "Creating data directory: C:\\ProgramData\\BlueLedger"
  nsExec::ExecToLog 'cmd /C mkdir "C:\\ProgramData\\BlueLedger" 2>nul'
  DetailPrint "Creating uploads directory: C:\\ProgramData\\BlueLedger\\uploads"
  nsExec::ExecToLog 'cmd /C mkdir "C:\\ProgramData\\BlueLedger\\uploads" 2>nul'
  DetailPrint "Granting LOCAL SERVICE modify rights"
  nsExec::ExecToLog 'icacls "C:\\ProgramData\\BlueLedger" /grant "LOCAL SERVICE:(OI)(CI)M" /T /C'
  nsExec::ExecToLog 'icacls "C:\\ProgramData\\BlueLedger\\uploads" /grant "LOCAL SERVICE:(OI)(CI)M" /T /C'

  DetailPrint "Adding firewall rule for BlueLedger Backend (TCP 3000)"
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="BlueLedger Backend 3000" dir=in action=allow protocol=TCP localport=3000'

  DetailPrint "Installing BlueLedger Backend service"
  nsExec::ExecToLog '"$INSTDIR\\resources\\BlueLedgerBackend.exe" install'
  DetailPrint "Starting BlueLedger Backend service"
  nsExec::ExecToLog '"$INSTDIR\\resources\\BlueLedgerBackend.exe" start'
!macroend

!macro customUnInstall
  DetailPrint "Stopping BlueLedger Backend service"
  nsExec::ExecToLog '"$INSTDIR\\resources\\BlueLedgerBackend.exe" stop'
  DetailPrint "Uninstalling BlueLedger Backend service"
  nsExec::ExecToLog '"$INSTDIR\\resources\\BlueLedgerBackend.exe" uninstall'

  DetailPrint "Removing firewall rule for BlueLedger Backend (TCP 3000)"
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="BlueLedger Backend 3000"'
!macroend
