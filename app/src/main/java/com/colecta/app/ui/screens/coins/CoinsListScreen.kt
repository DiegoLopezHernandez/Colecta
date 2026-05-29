package com.colecta.app.ui.screens.coins

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.FilterList
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import sh.calvin.reorderable.ReorderableItem
import sh.calvin.reorderable.rememberReorderableLazyListState
import com.colecta.app.data.db.CoinEntity
import com.colecta.app.data.repo.CoinRepository
import com.colecta.app.domain.model.CoinCategory
import com.colecta.app.domain.model.PossessionStatus
import com.colecta.app.domain.model.emoji
import com.colecta.app.domain.model.label
import com.colecta.app.ui.components.EmptyState
import com.colecta.app.ui.components.Pill
import com.colecta.app.ui.components.SearchBar
import com.colecta.app.ui.components.SectionTitle
import com.colecta.app.ui.theme.ColectaColors
import com.colecta.app.util.formatCurrency
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/** Estado de filtros encapsulado para que crezca sin hinchar el VM. */
data class CoinFilters(
    val search: String = "",
    val category: CoinCategory? = null,
    val possession: PossessionStatus? = null,
    /** Precio máximo en EUR. null = sin tope. */
    val priceMax: Float? = null,
    /** Etiqueta a filtrar (contiene, case-insensitive). null = todas. */
    val tag: String? = null,
) {
    fun matches(c: CoinEntity): Boolean {
        if (category != null && c.category != category.name) return false
        if (possession != null && c.possessionStatus != possession.name) return false
        if (priceMax != null) {
            val price = c.ebayLastPriceEur ?: c.ebayLastPrice ?: c.numistaTypicalValue ?: 0.0
            if (price > priceMax) return false
        }
        if (!tag.isNullOrBlank()) {
            val tags = c.tags?.lowercase().orEmpty()
            if (!tags.contains(tag.lowercase())) return false
        }
        if (search.isNotBlank()) {
            val term = search.trim().lowercase()
            val hay = listOf(c.title, c.country, c.year.toString(), c.denomination.orEmpty(), c.tags.orEmpty())
            if (hay.none { it.lowercase().contains(term) }) return false
        }
        return true
    }
}

@HiltViewModel
class CoinsListViewModel @Inject constructor(
    private val repo: CoinRepository,
) : ViewModel() {
    private val _filters = MutableStateFlow(CoinFilters())
    val filters: StateFlow<CoinFilters> = _filters

    val coins: StateFlow<List<CoinEntity>> =
        combine(repo.all, _filters) { all, f -> all.filter(f::matches) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun setSearch(v: String) { _filters.value = _filters.value.copy(search = v) }
    fun setCategory(v: CoinCategory?) { _filters.value = _filters.value.copy(category = v) }
    fun setPossession(v: PossessionStatus?) { _filters.value = _filters.value.copy(possession = v) }
    fun setPriceMax(v: Float?) { _filters.value = _filters.value.copy(priceMax = v) }
    fun setTag(v: String?) { _filters.value = _filters.value.copy(tag = v?.takeIf { it.isNotBlank() }) }
    fun clear() { _filters.value = CoinFilters() }

    /**
     * Reordena la lista visible y persiste el nuevo `sortOrder` para los items
     * movidos. Funciona también con filtros aplicados: solo se reescriben las
     * posiciones de los items visibles, los demás conservan su orden relativo.
     */
    fun reorder(fromIndex: Int, toIndex: Int) {
        val current = coins.value.toMutableList()
        if (fromIndex !in current.indices || toIndex !in current.indices) return
        val moved = current.removeAt(fromIndex)
        current.add(toIndex, moved)
        viewModelScope.launch {
            current.forEachIndexed { idx, c ->
                if (c.sortOrder != idx) repo.setSortOrder(c.id, idx)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CoinsListScreen(
    onAdd: () -> Unit,
    onOpen: (String) -> Unit,
    vm: CoinsListViewModel = hiltViewModel(),
) {
    val coins by vm.coins.collectAsStateWithLifecycle()
    val filters by vm.filters.collectAsStateWithLifecycle()
    var filtersOpen by remember { mutableStateOf(false) }
    val hasActiveFilters = filters.category != null || filters.possession != null ||
        filters.priceMax != null || !filters.tag.isNullOrBlank()

    Scaffold(
        containerColor = ColectaColors.Bg,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Mis monedas", color = ColectaColors.OnBg, fontWeight = FontWeight.Bold)
                        Text(
                            if (coins.isEmpty()) "Sin monedas todavía"
                            else "${coins.size} ${if (coins.size == 1) "pieza" else "piezas"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = ColectaColors.OnBgMuted,
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { filtersOpen = true }) {
                        BadgedBox(
                            badge = {
                                if (hasActiveFilters) Badge(containerColor = ColectaColors.Primary)
                            },
                        ) {
                            Icon(Icons.Outlined.FilterList, contentDescription = "Filtros", tint = ColectaColors.OnBg)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ColectaColors.Bg),
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onAdd,
                containerColor = ColectaColors.Primary,
                contentColor = ColectaColors.OnPrimary,
            ) { Icon(Icons.Filled.Add, contentDescription = "Añadir moneda") }
        },
    ) { inner ->
        Column(modifier = Modifier.padding(inner).padding(horizontal = 16.dp)) {
            SearchBar(value = filters.search, onValueChange = vm::setSearch)
            Spacer(Modifier.height(10.dp))
            if (coins.isEmpty()) {
                EmptyState(
                    emoji = "🪙",
                    title = if (hasActiveFilters) "Ningún resultado" else "Sin monedas todavía",
                    description = if (hasActiveFilters) "Cambia o limpia los filtros para ver más."
                    else "Pulsa el botón + para añadir tu primera moneda.",
                )
            } else {
                val lazyState = rememberLazyListState()
                val reorderState = rememberReorderableLazyListState(lazyState) { from, to ->
                    vm.reorder(from.index, to.index)
                }
                LazyColumn(
                    state = lazyState,
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 96.dp),
                ) {
                    items(coins, key = { it.id }) { c ->
                        ReorderableItem(reorderState, key = c.id) { isDragging ->
                            CoinRowItem(
                                coin = c,
                                onClick = { onOpen(c.id) },
                                dragModifier = Modifier.longPressDraggableHandle(),
                                elevated = isDragging,
                            )
                        }
                    }
                }
            }
        }
    }

    if (filtersOpen) {
        ModalBottomSheet(
            onDismissRequest = { filtersOpen = false },
            containerColor = ColectaColors.Surface,
        ) {
            FiltersSheet(
                filters = filters,
                vm = vm,
                onClose = { filtersOpen = false },
            )
        }
    }
}

@Composable
private fun FiltersSheet(filters: CoinFilters, vm: CoinsListViewModel, onClose: () -> Unit) {
    Column(modifier = Modifier.padding(horizontal = 16.dp).padding(bottom = 24.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Filtros", style = MaterialTheme.typography.titleMedium, color = ColectaColors.OnBg, modifier = Modifier.weight(1f))
            TextButton(onClick = { vm.clear() }) { Text("Limpiar", color = ColectaColors.Primary) }
        }

        SectionTitle("Categoría")
        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            item {
                Pill("Todas", active = filters.category == null) { vm.setCategory(null) }
            }
            items(CoinCategory.entries) { cat ->
                Pill(
                    label = "${cat.emoji} ${cat.display}",
                    active = filters.category == cat,
                ) { vm.setCategory(if (filters.category == cat) null else cat) }
            }
        }

        SectionTitle("Estado")
        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            item {
                Pill("Todos", active = filters.possession == null) { vm.setPossession(null) }
            }
            items(PossessionStatus.entries) { p ->
                Pill(
                    label = "${p.emoji()} ${p.label()}",
                    active = filters.possession == p,
                ) { vm.setPossession(if (filters.possession == p) null else p) }
            }
        }

        SectionTitle("Etiqueta")
        OutlinedTextField(
            value = filters.tag.orEmpty(),
            onValueChange = vm::setTag,
            placeholder = { Text("Filtrar por etiqueta…", color = ColectaColors.OnBgSubtle) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = ColectaColors.Surface2,
                unfocusedContainerColor = ColectaColors.Surface2,
                focusedBorderColor = ColectaColors.Primary,
                unfocusedBorderColor = ColectaColors.Border,
                focusedTextColor = ColectaColors.OnBg,
                unfocusedTextColor = ColectaColors.OnBg,
            ),
            shape = RoundedCornerShape(12.dp),
        )

        SectionTitle(
            if (filters.priceMax == null) "Precio máx: sin límite"
            else "Precio máx: ${filters.priceMax.toInt()} €",
        )
        Slider(
            value = filters.priceMax ?: 1000f,
            onValueChange = { vm.setPriceMax(if (it >= 1000f) null else it) },
            valueRange = 0f..1000f,
            steps = 99,
            colors = SliderDefaults.colors(
                thumbColor = ColectaColors.Primary,
                activeTrackColor = ColectaColors.Primary,
                inactiveTrackColor = ColectaColors.Border,
            ),
        )

        Spacer(Modifier.height(12.dp))
        Button(
            onClick = onClose,
            modifier = Modifier.fillMaxWidth().height(48.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = ColectaColors.Primary,
                contentColor = ColectaColors.OnPrimary,
            ),
            shape = RoundedCornerShape(12.dp),
        ) { Text("Aplicar") }
    }
}

@Composable
private fun CoinRowItem(
    coin: CoinEntity,
    onClick: () -> Unit,
    dragModifier: Modifier = Modifier,
    elevated: Boolean = false,
) {
    val price = coin.ebayLastPrice ?: coin.numistaTypicalValue
    val currency = coin.ebayLastPriceCurrency ?: "EUR"
    val shape = RoundedCornerShape(14.dp)
    val borderColor = if (elevated) ColectaColors.Primary else ColectaColors.Border
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(ColectaColors.Surface)
            .border(1.dp, borderColor, shape)
            .clickable(onClick = onClick)
            .then(dragModifier)
            .padding(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(ColectaColors.Surface2),
        ) {
            val img = coin.frontImageUri ?: coin.officialObverseUrl
            if (img != null) {
                AsyncImage(
                    model = img,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                )
            } else {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("🪙", style = MaterialTheme.typography.titleLarge)
                }
            }
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                coin.title,
                color = ColectaColors.OnBg,
                style = MaterialTheme.typography.titleSmall,
                maxLines = 1,
            )
            Text(
                "${coin.country} · ${coin.year}${coin.denomination?.let { " · $it" }.orEmpty()}",
                color = ColectaColors.OnBgMuted,
                style = MaterialTheme.typography.bodySmall,
                maxLines = 1,
            )
            Spacer(Modifier.height(4.dp))
            val pstr = runCatching { PossessionStatus.valueOf(coin.possessionStatus) }.getOrNull()
            val tagsCsv = coin.tags
            if (pstr != null || !tagsCsv.isNullOrBlank()) {
                Text(
                    buildString {
                        if (pstr != null) append("${pstr.emoji()} ${pstr.label()}")
                        if (!tagsCsv.isNullOrBlank()) {
                            if (pstr != null) append(" · ")
                            append(tagsCsv.split(",").joinToString(" · ") { "#${it.trim()}" })
                        }
                    },
                    color = ColectaColors.OnBgMuted,
                    style = MaterialTheme.typography.labelSmall,
                    maxLines = 1,
                )
            }
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                formatCurrency(price, currency),
                color = ColectaColors.Primary,
                style = MaterialTheme.typography.titleSmall,
            )
            if (coin.ebayPriceNotFound) {
                Text(
                    "sin precio",
                    color = ColectaColors.Warn,
                    style = MaterialTheme.typography.labelSmall,
                )
            }
        }
    }
}
