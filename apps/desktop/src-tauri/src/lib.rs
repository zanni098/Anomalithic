//! Anomalithic desktop shell. Renders the web UI (apps/web) and talks to the local
//! runtime server (`anomalithic serve`, default port 4517) for streaming swarm traces.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running the Anomalithic desktop app");
}
