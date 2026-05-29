package com.colecta.app.ui.screens.coins

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.CreateNewFolder
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
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
import com.colecta.app.data.db.CoinEntity
import com.colecta.app.data.prefs.SettingsRepository
import com.colecta.app.data.repo.CoinRepository
import com.colecta.app.data.repo.FxRepository
import com.colecta.app.data.repo.IdentificationRepository
import com.colecta.app.domain.model.CoinCategory
import com.colecta.app.domain.model.CoinCondition
import com.colecta.app.domain.model.CoinRarity
import com.colecta.app.domain.model.label
import com.colecta.app.ui.components.ColectaCard
import com.colecta.app.ui.components.DangerButton
import com.colecta.app.ui.components.DataRow
import com.colecta.app.ui.components.PrimaryButton
import com.colecta.app.ui.components.SecondaryButton
import com.colecta.app.ui.components.SectionTitle
import com.colecta.app.ui.components.ZoomableImageViewer
import com.colecta.app.ui.screens.collections.SelectCollectionsSheet
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

data class CoinDetailUiState(
    val coin: CoinEntity? = null,
    val loading: Boolean = false,
    val updatingPrice: Boolean = false,
    val message: String? = null,
)

@HiltViewModel
class CoinDetailViewModel @Inject constructor(
    private val repo: CoinRepository,
    private val identification: IdentificationRepository,
    private val settings: SettingsRepository,
    private val fx: FxRepository,
    savedState: SavedStateHandle,
) : ViewModel() {
    private val id: String = checkNotNull(savedState["id"]) { "Coin id requerido" }
    private val _state = MutableStateFlow(CoinDetailUiState(loading = true))
    val state: StateFlow<CoinDetailUiState> = _state

    init { reload() }

    fun reload() {
        viewModelScope.launch {
            val c = repo.get(id)
            _state.value = CoinDetailUiState(coin = c, loading = false)
        }
    }

    fun updatePrice() {
        val coin = _state.value.coin ?: return
        viewModelScope.launch {
            _state.value = _state.value.copy(updatingPrice = true, message = null)
            val keys = settings.keys.first()
            if (!keys.hasEbay) {
                _state.value = _state.value.copy(updatingPrice = false, message = "Falta el App ID de eBay (Ajustes).")
                return@launch
            }
            val r = identification.fetchEbayPrice(keys.ebayAppId, coin.title)
            r.onSuccess { price ->
                val now = nowIso()
                val priceEur = price?.let { fx.toEur(it.price, it.currency) }
                val updated = coin.copy(
                    ebayLastPrice = price?.price ?: coin.ebayLastPrice,
                    ebayLastPriceCurrency = price?.currency ?: coin.ebayLastPriceCurrency,
                    ebayLastPriceDate = price?.endDate ?: coin.ebayLastPriceDate,
                    ebayLastPriceUpdatedAt = now,
                    ebayLastPriceEur = priceEur ?: coin.ebayLastPriceEur,
                    ebayPriceNotFound = price == null,
                )
                repo.upsert(updated)
                _state.value = _state.value.copy(
                    coin = updated,
                    updatingPrice = false,
                    message = if (price != null) "Precio actualizado" else "Sin resultados en eBay",
                )
            }.onFailure { e ->
                _state.value = _state.value.copy(updatingPrice = false, message = e.message)
            }
        }
    }

    fun delete(onDone: () -> Unit) {
        viewModelScope.launch {
            repo.delete(id)
            onDone()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CoinDetailScreen(
    onBack: () -> Unit,
    onEdit: (String) -> Unit,
    vm: CoinDetailViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    var confirmDelete by remember { mutableStateOf(false) }
    var zoomUri by remember { mutableStateOf<String?>(null) }
    var albumsSheetFor by remember { mutableStateOf<String?>(null) }

    ZoomableImageViewer(uri = zoomUri, onClose = { zoomUri = null })
    albumsSheetFor?.let { id ->
        SelectCollectionsSheet(coinId = id, onDismiss = { albumsSheetFor = null })
    }

    if (state.loading) {
        Scaffold(containerColor = ColectaColors.Bg) { CircularProgressIndicator() }
        return
    }
    val coin = state.coin
    if (coin == null) {
        Scaffold(
            containerColor = ColectaColors.Bg,
            topBar = {
                TopAppBar(
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = ColectaColors.OnBg)
                        }
                    },
                    title = { Text("Moneda no encontrada", color = ColectaColors.OnBg) },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = ColectaColors.Bg),
                )
            },
        ) {}
        return
    }

    Scaffold(
        containerColor = ColectaColors.Bg,
        topBar = {
            TopAppBar(
                title = { Text(coin.title, color = ColectaColors.OnBg, fontWeight = FontWeight.SemiBold, maxLines = 1) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = ColectaColors.OnBg)
                    }
                },
                actions = {
                    IconButton(onClick = { albumsSheetFor = coin.id }) {
                        Icon(Icons.Outlined.CreateNewFolder, contentDescription = "Álbumes", tint = ColectaColors.OnBg)
                    }
                    IconButton(onClick = { onEdit(coin.id) }) {
                        Icon(Icons.Outlined.Edit, contentDescription = "Editar", tint = ColectaColors.Primary)
                    }
                    IconButton(onClick = { confirmDelete = true }) {
                        Icon(Icons.Outlined.Delete, contentDescription = "Eliminar", tint = ColectaColors.Err)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ColectaColors.Bg),
            )
        },
    ) { inner ->
        Column(
            modifier = Modifier
                .padding(inner)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(
                "${coin.country} · ${coin.year}${coin.denomination?.let { " · $it" }.orEmpty()}",
                color = ColectaColors.OnBgMuted,
                style = MaterialTheme.typography.bodySmall,
            )

            val frontImg = coin.frontImageUri ?: coin.officialObverseUrl
            val backImg = coin.backImageUri ?: coin.officialReverseUrl
            if (frontImg != null || backImg != null) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    frontImg?.let {
                        ImageTile(it, "Anverso", Modifier.weight(1f), onClick = { zoomUri = it })
                    }
                    backImg?.let {
                        ImageTile(it, "Reverso", Modifier.weight(1f), onClick = { zoomUri = it })
                    }
                }
            }

            SectionTitle("Ficha")
            ColectaCard {
                DataRow("País", coin.country)
                DataRow("Año", coin.year.toString())
                DataRow("Denominación", coin.denomination)
                DataRow("Composición", coin.composition)
                DataRow("Peso", coin.weightG?.let { "$it g" })
                DataRow("Diámetro", coin.diameterMm?.let { "$it mm" })
                DataRow("Tirada", coin.mintage?.toString())
                DataRow("Rareza", coin.rarity?.let { runCatching { CoinRarity.valueOf(it).label() }.getOrNull() })
                DataRow("Conservación", runCatching { CoinCondition.valueOf(coin.condition).label() }.getOrNull())
                DataRow("Categoría", runCatching { CoinCategory.valueOf(coin.category).display }.getOrNull(), last = true)
            }

            SectionTitle("Precio")
            ColectaCard {
                DataRow("Numista típico", coin.numistaTypicalValue?.let { formatCurrency(it, "EUR") })
                DataRow("Numista mín", coin.numistaMinValue?.let { formatCurrency(it, "EUR") })
                DataRow("Numista máx", coin.numistaMaxValue?.let { formatCurrency(it, "EUR") })
                DataRow(
                    "eBay" + (coin.ebayLastPriceDate?.let { "\n${formatDate(it)}" }.orEmpty()),
                    coin.ebayLastPrice?.let { formatCurrency(it, coin.ebayLastPriceCurrency ?: "EUR") },
                    last = true,
                )
                if (coin.ebayPriceNotFound) {
                    Spacer(Modifier.height(8.dp))
                    Text("Sin resultados en eBay", color = ColectaColors.Warn, style = MaterialTheme.typography.bodySmall)
                }
            }

            if (!coin.notes.isNullOrBlank()) {
                SectionTitle("Notas")
                ColectaCard { Text(coin.notes, color = ColectaColors.OnBg) }
            }

            state.message?.let {
                Text(it, color = ColectaColors.OnBgMuted, style = MaterialTheme.typography.bodySmall)
            }

            PrimaryButton(
                label = "Actualizar precio eBay",
                onClick = vm::updatePrice,
                loading = state.updatingPrice,
            )
            SecondaryButton(label = "Editar", onClick = { onEdit(coin.id) })
            DangerButton(label = "Eliminar", onClick = { confirmDelete = true })
        }
    }

    if (confirmDelete) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        confirmDelete = false
                        vm.delete(onBack)
                    },
                ) { Text("Eliminar", color = ColectaColors.Err) }
            },
            dismissButton = {
                TextButton(onClick = { confirmDelete = false }) { Text("Cancelar") }
            },
            title = { Text("Eliminar moneda") },
            text = { Text("Esta acción no se puede deshacer.") },
            containerColor = ColectaColors.Surface,
        )
    }
}

@Composable
private fun ImageTile(uri: String, label: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Column(modifier = modifier) {
        Text(
            label.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = ColectaColors.OnBgSubtle,
            modifier = Modifier.padding(bottom = 6.dp),
        )
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .clip(RoundedCornerShape(12.dp))
                .background(ColectaColors.Surface2)
                .border(1.dp, ColectaColors.Border, RoundedCornerShape(12.dp))
                .clickable(onClick = onClick),
        ) {
            AsyncImage(
                model = uri,
                contentDescription = label,
                modifier = Modifier.fillMaxSize(),
                contentScale = androidx.compose.ui.layout.ContentScale.Fit,
            )
        }
    }
}
