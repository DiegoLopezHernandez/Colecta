package com.colecta.app.ui.screens.coins

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.colecta.app.data.db.CoinEntity
import com.colecta.app.data.prefs.SettingsRepository
import com.colecta.app.data.repo.CoinRepository
import com.colecta.app.data.repo.FxRepository
import com.colecta.app.data.repo.IdentificationRepository
import com.colecta.app.domain.model.*
import com.colecta.app.ui.components.*
import com.colecta.app.ui.theme.ColectaColors
import com.colecta.app.util.Country
import com.colecta.app.util.COUNTRIES
import com.colecta.app.util.formatCurrency
import com.colecta.app.util.nowIso
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.util.UUID

/**
 * Pantalla unificada de alta de moneda. Avanza por fases internas:
 *   1. INPUT: foto + país + año (+ opcional nombre/denominación)
 *   2. CANDIDATES: muestra candidatos de Numista para elegir
 *   3. CONFIRM: ficha completa de Numista + precio eBay + clasificación
 *
 * El usuario puede saltar Numista en cualquier momento ("Guardar sin Numista").
 */
data class AddCoinUiState(
    val phase: Phase = Phase.INPUT,
    val frontUri: String? = null,
    val backUri: String? = null,
    val country: Country? = null,
    val yearText: String = "",
    val query: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val candidates: List<NumistaCandidate> = emptyList(),
    val full: NumistaFullData? = null,
    val ebayPrice: EbayPrice? = null,
    val ebayNotFound: Boolean = false,
    val condition: CoinCondition = CoinCondition.VERY_FINE,
    val category: CoinCategory = CoinCategory.EURO,
    val possession: PossessionStatus = PossessionStatus.OWNED,
    val tagsCsv: String? = null,
    val notes: String = "",
    val saved: Boolean = false,
) {
    enum class Phase { INPUT, CANDIDATES, CONFIRM }
}

@HiltViewModel
class AddCoinViewModel @Inject constructor(
    private val identification: IdentificationRepository,
    private val coins: CoinRepository,
    private val settings: SettingsRepository,
    private val fx: FxRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(AddCoinUiState())
    val state: StateFlow<AddCoinUiState> = _state

    fun setFront(u: String?) { _state.value = _state.value.copy(frontUri = u) }
    fun setBack(u: String?) { _state.value = _state.value.copy(backUri = u) }
    fun setCountry(c: Country?) { _state.value = _state.value.copy(country = c) }
    fun setYearText(v: String) { _state.value = _state.value.copy(yearText = v.filter { it.isDigit() }.take(4)) }
    fun setQuery(v: String) { _state.value = _state.value.copy(query = v) }
    fun setCondition(v: CoinCondition) { _state.value = _state.value.copy(condition = v) }
    fun setCategory(v: CoinCategory) { _state.value = _state.value.copy(category = v) }
    fun setPossession(v: PossessionStatus) { _state.value = _state.value.copy(possession = v) }
    fun setTags(v: String?) { _state.value = _state.value.copy(tagsCsv = v) }
    fun setNotes(v: String) { _state.value = _state.value.copy(notes = v) }

    fun identify() {
        val s = _state.value
        val year = s.yearText.toIntOrNull()
        if (s.country == null || year == null || s.yearText.length < 3) {
            _state.value = s.copy(error = "Selecciona país y año (3-4 dígitos).")
            return
        }
        viewModelScope.launch {
            _state.value = s.copy(loading = true, error = null)
            val keys = settings.keys.first()
            val res = identification.searchCandidates(keys.numistaApiKey, s.country.code, year, s.query.ifBlank { null })
            res.onSuccess { list ->
                _state.value = _state.value.copy(loading = false, candidates = list, phase = AddCoinUiState.Phase.CANDIDATES)
            }.onFailure { e ->
                _state.value = _state.value.copy(loading = false, error = e.message ?: "Error desconocido")
            }
        }
    }

    fun choose(candidate: NumistaCandidate) {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            val keys = settings.keys.first()
            val full = identification.fetchFullData(keys.numistaApiKey, candidate.numistaId)
                .getOrElse { e -> _state.value = _state.value.copy(loading = false, error = e.message); return@launch }
            val ebay = identification.fetchEbayPrice(keys.ebayAppId, full.title)
                .getOrElse { null }
            _state.value = _state.value.copy(
                loading = false,
                phase = AddCoinUiState.Phase.CONFIRM,
                full = full,
                ebayPrice = ebay,
                ebayNotFound = ebay == null && keys.hasEbay,
            )
        }
    }

    /** Saltar Numista → ir directo a confirmar con datos manuales mínimos. */
    fun skipNumista() {
        val s = _state.value
        val title = s.query.ifBlank { s.country?.name ?: "" } + " ${s.yearText}"
        _state.value = s.copy(
            phase = AddCoinUiState.Phase.CONFIRM,
            full = null,
            ebayPrice = null,
            ebayNotFound = false,
        ).let { it.copy(notes = it.notes.ifBlank { title.trim() }) }
    }

    fun save(onDone: () -> Unit) {
        val s = _state.value
        val year = s.yearText.toIntOrNull() ?: return
        val country = s.country ?: return
        val title = s.full?.title?.takeIf { it.isNotBlank() }
            ?: s.query.ifBlank { "${country.name} $year" }
        viewModelScope.launch {
            val priceEur = s.ebayPrice?.let { fx.toEur(it.price, it.currency) }
            val entity = CoinEntity(
                id = UUID.randomUUID().toString(),
                numistaId = s.full?.numistaId,
                title = title,
                country = s.full?.country?.ifBlank { country.name } ?: country.name,
                year = year,
                denomination = s.full?.denomination,
                composition = s.full?.composition,
                weightG = s.full?.weightG,
                diameterMm = s.full?.diameterMm,
                mintage = s.full?.mintage,
                rarity = s.full?.rarity?.name,
                numistaMinValue = s.full?.numistaMinValue,
                numistaTypicalValue = s.full?.numistaTypicalValue,
                numistaMaxValue = s.full?.numistaMaxValue,
                numistaUrl = s.full?.numistaUrl,
                ebayLastPrice = s.ebayPrice?.price,
                ebayLastPriceCurrency = s.ebayPrice?.currency,
                ebayLastPriceDate = s.ebayPrice?.endDate,
                ebayLastPriceUpdatedAt = if (s.ebayPrice != null) nowIso() else null,
                ebayLastPriceEur = priceEur,
                ebayPriceNotFound = s.ebayNotFound,
                frontImageUri = s.frontUri,
                backImageUri = s.backUri,
                officialObverseUrl = s.full?.officialObverseUrl,
                officialReverseUrl = s.full?.officialReverseUrl,
                condition = s.condition.name,
                possessionStatus = s.possession.name,
                category = s.category.name,
                tags = s.tagsCsv?.takeIf { it.isNotBlank() },
                notes = s.notes.ifBlank { null },
                createdAt = nowIso(),
                updatedAt = nowIso(),
            )
            coins.upsert(entity)
            _state.value = _state.value.copy(saved = true)
            onDone()
        }
    }

    fun back() {
        _state.value = when (_state.value.phase) {
            AddCoinUiState.Phase.CONFIRM -> _state.value.copy(phase = AddCoinUiState.Phase.CANDIDATES)
            AddCoinUiState.Phase.CANDIDATES -> _state.value.copy(phase = AddCoinUiState.Phase.INPUT)
            AddCoinUiState.Phase.INPUT -> _state.value
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddCoinScreen(
    onBack: () -> Unit,
    vm: AddCoinViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Scaffold(
        containerColor = ColectaColors.Bg,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        when (state.phase) {
                            AddCoinUiState.Phase.INPUT -> "Nueva moneda"
                            AddCoinUiState.Phase.CANDIDATES -> "Elegir candidato"
                            AddCoinUiState.Phase.CONFIRM -> "Confirmar"
                        },
                        color = ColectaColors.OnBg,
                        fontWeight = FontWeight.SemiBold,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = {
                        if (state.phase == AddCoinUiState.Phase.INPUT) onBack() else vm.back()
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver", tint = ColectaColors.OnBg)
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
            when (state.phase) {
                AddCoinUiState.Phase.INPUT -> InputPhase(state, vm)
                AddCoinUiState.Phase.CANDIDATES -> CandidatesPhase(state, vm)
                AddCoinUiState.Phase.CONFIRM -> ConfirmPhase(state, vm, onSaved = onBack)
            }
            state.error?.let {
                Text(it, color = ColectaColors.Err, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
private fun InputPhase(state: AddCoinUiState, vm: AddCoinViewModel) {
    SectionTitle("Fotografías (opcional)")
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        PhotoCaptureCard(
            label = "Anverso",
            uri = state.frontUri,
            onChange = vm::setFront,
            modifier = Modifier.weight(1f),
        )
        PhotoCaptureCard(
            label = "Reverso",
            uri = state.backUri,
            onChange = vm::setBack,
            modifier = Modifier.weight(1f),
        )
    }

    SectionTitle("Datos")
    CountryPicker(selected = state.country, onSelect = vm::setCountry)
    LabeledField(
        label = "Año",
        value = state.yearText,
        onValueChange = vm::setYearText,
        keyboardType = KeyboardType.Number,
        maxLength = 4,
        placeholder = "Ej: 2001",
    )
    LabeledField(
        label = "Denominación o nombre (opcional)",
        value = state.query,
        onValueChange = vm::setQuery,
        placeholder = "Ej: 50 céntimos",
    )

    Spacer(Modifier.height(4.dp))
    PrimaryButton(
        label = "Identificar en Numista",
        onClick = vm::identify,
        loading = state.loading,
        enabled = state.country != null && state.yearText.length >= 3,
    )
    SecondaryButton(
        label = "Continuar sin Numista",
        onClick = vm::skipNumista,
    )
}

@Composable
private fun CandidatesPhase(state: AddCoinUiState, vm: AddCoinViewModel) {
    if (state.loading) {
        LoadingView(label = "Buscando…", modifier = Modifier.height(200.dp))
        return
    }
    if (state.candidates.isEmpty()) {
        EmptyState(
            emoji = "🔍",
            title = "Sin coincidencias",
            description = "No se encontraron monedas para esos datos en Numista.",
            modifier = Modifier.height(280.dp),
        )
        PrimaryButton(label = "Guardar sin Numista", onClick = vm::skipNumista)
        return
    }
    Text(
        "Pulsa la coincidencia correcta",
        color = ColectaColors.OnBgMuted,
        style = MaterialTheme.typography.bodySmall,
    )
    state.candidates.forEach { c ->
        CandidateRow(c) { vm.choose(c) }
    }
    SecondaryButton(label = "Ninguna coincide", onClick = vm::skipNumista)
}

@Composable
private fun CandidateRow(c: NumistaCandidate, onClick: () -> Unit) {
    val shape = RoundedCornerShape(14.dp)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(ColectaColors.Surface)
            .border(1.dp, ColectaColors.Border, shape)
            .clickable(onClick = onClick)
            .padding(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(ColectaColors.Surface2),
            contentAlignment = Alignment.Center,
        ) {
            if (c.obverseThumb != null) {
                AsyncImage(
                    model = c.obverseThumb,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = androidx.compose.ui.layout.ContentScale.Fit,
                )
            } else {
                Text("🪙", style = MaterialTheme.typography.titleLarge)
            }
        }
        Spacer(Modifier.width(12.dp))
        Column {
            Text(c.title, color = ColectaColors.OnBg, style = MaterialTheme.typography.titleSmall, maxLines = 2)
            Text(
                "${c.country} · ${c.year}",
                color = ColectaColors.OnBgMuted,
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

@Composable
private fun ConfirmPhase(state: AddCoinUiState, vm: AddCoinViewModel, onSaved: () -> Unit) {
    if (state.loading) {
        LoadingView(label = "Cargando ficha…", modifier = Modifier.height(200.dp))
        return
    }
    val full = state.full
    if (full != null) {
        SectionTitle("Ficha Numista")
        ColectaCard {
            DataRow("País", full.country)
            DataRow("Año", full.year.toString())
            DataRow("Denominación", full.denomination)
            DataRow("Composición", full.composition)
            DataRow("Peso", full.weightG?.let { "$it g" })
            DataRow("Diámetro", full.diameterMm?.let { "$it mm" })
            DataRow("Tirada", full.mintage?.toString())
            DataRow("Rareza", full.rarity?.label(), last = true)
        }
    }

    SectionTitle("Precio")
    ColectaCard {
        when {
            state.ebayPrice != null -> {
                Text("Último precio en eBay", color = ColectaColors.OnBgSubtle, style = MaterialTheme.typography.labelSmall)
                Text(
                    formatCurrency(state.ebayPrice.price, state.ebayPrice.currency),
                    color = ColectaColors.Primary,
                    style = MaterialTheme.typography.titleLarge,
                )
            }
            state.ebayNotFound -> Text(
                "Sin resultados en eBay para esta moneda.",
                color = ColectaColors.Warn,
                style = MaterialTheme.typography.bodySmall,
            )
            else -> Text(
                "No se consultó eBay. Configura el App ID en Ajustes para precios automáticos.",
                color = ColectaColors.OnBgMuted,
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }

    SectionTitle("Clasificación")
    PillsRow(
        items = CoinCondition.entries.map { it to it.label() },
        selected = state.condition,
        onSelect = vm::setCondition,
    )
    Spacer(Modifier.height(4.dp))
    PillsRow(
        items = CoinCategory.entries.map { it to "${it.emoji} ${it.display}" },
        selected = state.category,
        onSelect = vm::setCategory,
    )
    Spacer(Modifier.height(4.dp))
    PillsRow(
        items = PossessionStatus.entries.map { it to "${it.emoji()} ${it.label()}" },
        selected = state.possession,
        onSelect = vm::setPossession,
    )

    SectionTitle("Etiquetas")
    TagsEditor(csv = state.tagsCsv, onCsvChange = vm::setTags)

    SectionTitle("Notas")
    LabeledField(
        label = "Notas",
        value = state.notes,
        onValueChange = vm::setNotes,
        placeholder = "Opcional…",
        singleLine = false,
    )

    Spacer(Modifier.height(8.dp))
    PrimaryButton(label = "Guardar moneda", onClick = { vm.save(onSaved) })
}

@Composable
private fun <T> PillsRow(items: List<Pair<T, String>>, selected: T, onSelect: (T) -> Unit) {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        items(items.size) { idx ->
            val (value, label) = items[idx]
            Pill(label = label, active = value == selected, onClick = { onSelect(value) })
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CountryPicker(selected: Country?, onSelect: (Country) -> Unit) {
    var open by remember { mutableStateOf(false) }
    OutlinedTextField(
        value = selected?.let { "${it.name} (${it.code})" } ?: "",
        onValueChange = {},
        readOnly = true,
        label = { Text("País", color = ColectaColors.OnBgMuted) },
        modifier = Modifier
            .fillMaxWidth()
            .clickable { open = true },
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = ColectaColors.Surface2,
            unfocusedContainerColor = ColectaColors.Surface2,
            focusedBorderColor = ColectaColors.Primary,
            unfocusedBorderColor = ColectaColors.Border,
            focusedTextColor = ColectaColors.OnBg,
            unfocusedTextColor = ColectaColors.OnBg,
            disabledTextColor = ColectaColors.OnBg,
        ),
        shape = RoundedCornerShape(12.dp),
        enabled = false,
    )
    if (open) {
        ModalBottomSheet(
            onDismissRequest = { open = false },
            containerColor = ColectaColors.Surface,
        ) {
            var filter by remember { mutableStateOf("") }
            Column(modifier = Modifier.padding(horizontal = 16.dp).fillMaxHeight(0.85f)) {
                SearchBar(value = filter, onValueChange = { filter = it }, placeholder = "Buscar país…")
                Spacer(Modifier.height(8.dp))
                val list = if (filter.isBlank()) COUNTRIES
                else COUNTRIES.filter { it.name.contains(filter, true) || it.code.contains(filter, true) }
                androidx.compose.foundation.lazy.LazyColumn {
                    items(list.size) { idx ->
                        val c = list[idx]
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    onSelect(c)
                                    open = false
                                }
                                .padding(vertical = 12.dp),
                        ) {
                            Text(c.name, color = ColectaColors.OnBg, modifier = Modifier.weight(1f))
                            Text(c.code, color = ColectaColors.OnBgMuted)
                        }
                    }
                }
            }
        }
    }
}
