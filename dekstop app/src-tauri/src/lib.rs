// KASIR POS — Tauri Backend
// Minimal Rust code: only system-level integrations.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
