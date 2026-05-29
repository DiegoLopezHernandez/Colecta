package com.colecta.app.ui.screens.settings

import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.colecta.app.data.backup.BackupScheduler
import com.colecta.app.data.prefs.BackupSettingsRepository
import com.colecta.app.data.prefs.SettingsRepository
import com.colecta.app.data.repo.BackupRepository
import com.colecta.app.ui.components.LabeledField
import com.colecta.app.ui.components.Pill
import com.colecta.app.ui.components.PrimaryButton
import com.colecta.app.ui.components.SecondaryButton
import com.colecta.app.ui.components.SectionTitle
import com.colecta.app.ui.theme.ColectaColors
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate

data class BackupUiState(
    val busy: Boolean = false,
    val lastMessage: String? = null,
    val confirmImport: android.net.Uri? = null,
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settings: SettingsRepository,
    private val backup: BackupRepository,
    private val backupPrefs: BackupSettingsRepository,
    private val scheduler: BackupScheduler,
) : ViewModel() {
    val keys = settings.keys
    val backupConfig = backupPrefs.config

    private val _backupState = MutableStateFlow(BackupUiState())
    val backupState: StateFlow<BackupUiState> = _backupState

    fun saveNumista(value: String) { viewModelScope.launch { settings.setNumistaApiKey(value) } }
    fun saveEbay(value: String) { viewModelScope.launch { settings.setEbayAppId(value) } }

    fun exportTo(uri: android.net.Uri) {
        viewModelScope.launch {
            _backupState.value = _backupState.value.copy(busy = true, lastMessage = null)
            val res = backup.exportTo(uri)
            _backupState.value = BackupUiState(
                busy = false,
                lastMessage = res.fold(
                    onSuccess = { count -> "Exportado: $count registros" },
                    onFailure = { e -> "Error al exportar: ${e.message}" },
                ),
            )
        }
    }

    fun askImport(uri: android.net.Uri) {
        _backupState.value = _backupState.value.copy(confirmImport = uri)
    }

    fun cancelImport() {
        _backupState.value = _backupState.value.copy(confirmImport = null)
    }

    fun confirmImport() {
        val uri = _backupState.value.confirmImport ?: return
        viewModelScope.launch {
            _backupState.value = _backupState.value.copy(busy = true, confirmImport = null)
            val res = backup.importFrom(uri)
            _backupState.value = BackupUiState(
                busy = false,
                lastMessage = res.fold(
                    onSuccess = { (c, o) -> "Importado: $c monedas, $o objetos" },
                    onFailure = { e -> "Error al importar: ${e.message}" },
                ),
            )
        }
    }

    fun setAutoBackupFolder(uri: String?) {
        viewModelScope.launch {
            backupPrefs.setFolder(uri)
            // Si no hay carpeta, cancelamos el worker; si hay y la frecuencia es >0,
            // lo dejamos como esté. La frecuencia se gestiona aparte.
            if (uri == null) scheduler.cancel()
        }
    }

    fun setAutoBackupFrequency(days: Int) {
        viewModelScope.launch {
            backupPrefs.setFrequency(days)
            scheduler.schedule(days)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(vm: SettingsViewModel = hiltViewModel()) {
    val context = LocalContext.current
    val keys by vm.keys.collectAsStateWithLifecycle(initialValue = SettingsRepository.Keys("", ""))
    val backupCfg by vm.backupConfig.collectAsStateWithLifecycle(initialValue = BackupSettingsRepository.Config(null, 0))
    val backupState by vm.backupState.collectAsStateWithLifecycle()
    var numista by remember(keys) { mutableStateOf(keys.numistaApiKey) }
    var ebay by remember(keys) { mutableStateOf(keys.ebayAppId) }
    var saved by remember { mutableStateOf(false) }

    val exportLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.CreateDocument("application/json"),
    ) { uri -> if (uri != null) vm.exportTo(uri) }

    val importLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocument(),
    ) { uri -> if (uri != null) vm.askImport(uri) }

    val folderLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocumentTree(),
    ) { uri ->
        if (uri != null) {
            // Persiste permiso de escritura para que el worker pueda usarlo en background.
            context.contentResolver.takePersistableUriPermission(
                uri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION,
            )
            vm.setAutoBackupFolder(uri.toString())
        }
    }

    Scaffold(
        containerColor = ColectaColors.Bg,
        topBar = {
            TopAppBar(
                title = { Text("Ajustes", color = ColectaColors.OnBg, fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ColectaColors.Bg),
            )
        },
    ) { inner ->
        Column(
            modifier = Modifier.padding(inner).padding(16.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            SectionTitle("Numista")
            Text(
                "API Key para identificar monedas. Pídela en https://numista.com/api/",
                color = ColectaColors.OnBgMuted,
                style = MaterialTheme.typography.bodySmall,
            )
            LabeledField("API Key", numista, { numista = it; saved = false }, placeholder = "Tu Numista-API-Key")

            SectionTitle("eBay")
            Text(
                "App ID (Client ID) para consultar precios. Crea uno en developer.ebay.com",
                color = ColectaColors.OnBgMuted,
                style = MaterialTheme.typography.bodySmall,
            )
            LabeledField("App ID", ebay, { ebay = it; saved = false }, placeholder = "MyApp-Name-PRD-xxxx-xxxx")

            PrimaryButton(
                label = if (saved) "Guardado ✓" else "Guardar claves",
                onClick = {
                    vm.saveNumista(numista)
                    vm.saveEbay(ebay)
                    saved = true
                },
            )

            SectionTitle("Copia de seguridad manual")
            Text(
                "Exporta toda tu colección a un archivo .json. Importar reemplaza todo.",
                color = ColectaColors.OnBgMuted,
                style = MaterialTheme.typography.bodySmall,
            )
            SecondaryButton(
                label = if (backupState.busy) "Procesando…" else "Exportar a JSON",
                onClick = { exportLauncher.launch("colecta-${LocalDate.now()}.json") },
            )
            SecondaryButton(
                label = "Importar desde JSON",
                onClick = { importLauncher.launch(arrayOf("application/json", "text/plain", "*/*")) },
            )
            backupState.lastMessage?.let {
                Text(it, color = ColectaColors.OnBgMuted, style = MaterialTheme.typography.bodySmall)
            }

            SectionTitle("Copia automática")
            Text(
                "Crea backups regularmente en una carpeta que tú elijas (Drive sincronizada, " +
                    "almacenamiento interno, etc.). Mantiene los 7 últimos.",
                color = ColectaColors.OnBgMuted,
                style = MaterialTheme.typography.bodySmall,
            )
            SecondaryButton(
                label = if (backupCfg.folderUri == null) "Elegir carpeta" else "Cambiar carpeta",
                onClick = { folderLauncher.launch(null) },
            )
            if (backupCfg.folderUri != null) {
                Text(
                    "Carpeta seleccionada ✓",
                    color = ColectaColors.Ok,
                    style = MaterialTheme.typography.bodySmall,
                )
                TextButton(onClick = { vm.setAutoBackupFolder(null) }) {
                    Text("Quitar carpeta", color = ColectaColors.Err)
                }
            }

            Text("Frecuencia", color = ColectaColors.OnBgMuted, style = MaterialTheme.typography.labelMedium)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                val opts = listOf(0 to "Desactivado", 1 to "Diaria", 7 to "Semanal", 30 to "Mensual")
                items(opts.size) { idx ->
                    val (days, label) = opts[idx]
                    Pill(
                        label = label,
                        active = backupCfg.frequencyDays == days,
                        onClick = { vm.setAutoBackupFrequency(days) },
                    )
                }
            }
            if (backupCfg.enabled) {
                Text(
                    "Activado · cada ${backupCfg.frequencyDays} día(s)",
                    color = ColectaColors.Ok,
                    style = MaterialTheme.typography.bodySmall,
                )
            } else if (backupCfg.folderUri == null && backupCfg.frequencyDays > 0) {
                Text(
                    "Selecciona una carpeta para activar el backup automático.",
                    color = ColectaColors.Warn,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
    }

    backupState.confirmImport?.let {
        AlertDialog(
            onDismissRequest = vm::cancelImport,
            confirmButton = {
                TextButton(onClick = vm::confirmImport) {
                    Text("Importar", color = ColectaColors.Err)
                }
            },
            dismissButton = {
                TextButton(onClick = vm::cancelImport) { Text("Cancelar") }
            },
            title = { Text("¿Reemplazar toda la colección?") },
            text = {
                Text(
                    "Importar este archivo borrará TODAS tus monedas y objetos actuales " +
                        "y los sustituirá por los del backup. Esta acción no se puede deshacer.",
                )
            },
            containerColor = ColectaColors.Surface,
        )
    }
}
