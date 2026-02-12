#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::Command;
use tauri::{Manager, WindowEvent};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

#[derive(Default)]
struct DaemonState {
    port: u16,
    pid: Option<u32>,
}

fn main() {
  tauri::Builder::default()
    .setup(|app| {
        let app_handle = app.handle();
        
        // MVP: Sidecar management
        // 1. Check if port 8400 is open
        // 2. If open, check /health
        // 3. If not, start sidecar
        
        // For MVP, we assume port 8400 default for now.
        // P08-R2 implementation will go here.
        
        // Inject daemon URL into window when it loads
        let window = app.get_window("main").unwrap();
        
        /* 
           This is where we'll implement P08-R2 (Port Strategy)
           let sidecar_command = app.shell().sidecar("codrag-daemon").unwrap();
           let (mut rx, mut child) = sidecar_command.spawn().expect("Failed to spawn sidecar");
        */

        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
