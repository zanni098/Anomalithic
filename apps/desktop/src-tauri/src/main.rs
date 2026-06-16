#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn runtime_info() -> serde_json::Value {
    serde_json::json!({
        "name": "Anomalithic",
        "version": env!("CARGO_PKG_VERSION"),
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![runtime_info])
        .run(tauri::generate_context!())
        .expect("error while running Anomalithic");
}
