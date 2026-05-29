package com.colecta.app.ui.screens.objects

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.colecta.app.data.db.ObjectEntity
import com.colecta.app.data.prefs.SettingsRepository
import com.colecta.app.data.repo.FxRepository
import com.colecta.app.data.repo.IdentificationRepository
import com.colecta.app.data.repo.ObjectRepository
import com.colecta.app.domain.model.ObjectType
import com.colecta.app.domain.model.PossessionStatus
import com.colecta.app.domain.model.emoji
import com.colecta.app.domain.model.label
import com.colecta.app.ui.components.ColectaCard
import com.colecta.app.ui.components.DangerButton
import com.colecta.app.ui.components.DataRow
import com.colecta.app.ui.components.PrimaryButton
import com.colecta.app.ui.components.SecondaryButton
import com.colecta.app.ui.components.SectionTitle
import com.colecta.app.ui.components.ZoomableImageViewer
import com.colecta.app.ui.theme.ColectaColors
import com.colecta.app.util.formatCurrency
import com.colecta.app.util.formatDate
import com.colecta.app.util.nowIso
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@HiltViewModel
class ObjectDetailViewModel @Inject constructor(
    private val repo: ObjectRepository,
    private val identification: IdentificationRepository,
    private val settings: SettingsRepository,
    private val fx: FxRepository,
    savedState: SavedStateHandle,
) : ViewModel() {
    private val id: String = checkNotNull(savedState["id"])
    private val _state = MutableStateFlow<ObjectEntity?>(null)
    val state: StateFlow<ObjectEntity?> = _state
    var updating by androidx.compose.runtime.mutableStateOf(false)
        private set

    init { viewModelScope.launch { _state.value = repo.get(id) } }

    fun updatePrice() {
        val o = _state.value ?: return
        viewModelScope.launch {
            updating = true
            val keys = settings.keys.first()
            if (!keys.hasEbay) { updating = false; return@launch }
            val r = identification.fetchEbayPrice(keys.ebayAppId, o.name).getOrNull()
            val now = nowIso()
            val priceEur = r?.let { fx.toEur(it.price, it.currency) }
            val updated = o.copy(
                ebayLastPrice = r?.price ?: o.ebayLastPrice,
                ebayLastPriceCurrency = r?.currency ?: o.ebayLastPriceCurrency,
                ebayLastPriceDate = r?.endDate ?: o.ebayLastPriceDate,
                ebayLastPriceUpdatedAt = now,
                ebayLastPriceEur = priceEur ?: o.ebayLastPriceEur,
                ebayPriceNotFound = r == null,
            )
            repo.upsert(updated)
            _state.value = updated
            updating = false
        }
    }

    fun delete(onDone: () -> Unit) {
        viewModelScope.launch { repo.delete(id); onDone() }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ObjectDetailScreen(
    onBack: () -> Unit,
    onEdit: (String) -> Unit,
    vm: ObjectDetailViewModel = hiltViewModel(),
) {
    val obj by vm.state.collectAsStateWithLifecycle()
    var confirmDelete by remember { mutableStateOf(false) }
    var zoomUri by remember { mutableStateOf<String?>(null) }

    ZoomableImageViewer(uri = zoomUri, onClose = { zoomUri = null })

    Scaffold(
        containerColor = ColectaColors.Bg,
        topBar = {
            TopAppBar(
                title = { Text(obj?.name ?: "Objeto", color = ColectaColors.OnBg, fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = ColectaColors.OnBg)
                    }
                },
                actions = {
                    obj?.let { o ->
                        IconButton(onClick = { onEdit(o.id) }) {
                            Icon(Icons.Outlined.Edit, contentDescription = "Editar", tint = ColectaColors.Primary)
                        }
                    }
                    IconButton(onClick = { confirmDelete = true }) {
                        Icon(Icons.Outlined.Delete, contentDescription = "Eliminar", tint = ColectaColors.Err)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ColectaColors.Bg),
            )
        },
    ) { inner ->
        val o = obj ?: run {
            Box(Modifier.padding(inner).fillMaxSize()) { CircularProgressIndicator() }
            return@Scaffold
        }
        Column(
            modifier = Modifier.padding(inner).padding(16.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            val front = o.frontImageUri
            if (front != null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(1f)
                        .clip(RoundedCornerShape(14.dp))
                        .background(ColectaColors.Surface2)
                        .border(1.dp, ColectaColors.Border, RoundedCornerShape(14.dp))
                        .clickable { zoomUri = front },
                ) {
                    AsyncImage(
                        model = front,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = androidx.compose.ui.layout.ContentScale.Fit,
                    )
                }
            }

            SectionTitle("Datos")
            ColectaCard {
                DataRow("Tipo", runCatching { ObjectType.valueOf(o.type).display }.getOrNull())
                DataRow("Estado", runCatching { PossessionStatus.valueOf(o.possessionStatus).label() }.getOrNull(), last = true)
            }

            SectionTitle("Precio")
            ColectaCard {
                DataRow(
                    "eBay" + (o.ebayLastPriceDate?.let { "\n${formatDate(it)}" }.orEmpty()),
                    o.ebayLastPrice?.let { formatCurrency(it, o.ebayLastPriceCurrency ?: "EUR") },
                    last = true,
                )
                if (o.ebayPriceNotFound) {
                    Spacer(Modifier.height(8.dp))
                    Text("Sin resultados en eBay", color = ColectaColors.Warn, style = MaterialTheme.typography.bodySmall)
                }
            }

            if (!o.notes.isNullOrBlank()) {
                SectionTitle("Notas")
                ColectaCard { Text(o.notes, color = ColectaColors.OnBg) }
            }

            PrimaryButton(label = "Actualizar precio eBay", onClick = vm::updatePrice, loading = vm.updating)
            SecondaryButton(label = "Editar", onClick = { onEdit(o.id) })
            DangerButton(label = "Eliminar", onClick = { confirmDelete = true })
        }
    }

    if (confirmDelete) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            confirmButton = {
                TextButton(onClick = { confirmDelete = false; vm.delete(onBack) }) {
                    Text("Eliminar", color = ColectaColors.Err)
                }
            },
            dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("Cancelar") } },
            title = { Text("Eliminar objeto") },
            text = { Text("Esta acción no se puede deshacer.") },
            containerColor = ColectaColors.Surface,
        )
    }
}
