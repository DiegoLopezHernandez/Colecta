package com.colecta.app.ui.screens.objects

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
import com.colecta.app.data.db.ObjectEntity
import com.colecta.app.data.repo.ObjectRepository
import com.colecta.app.domain.model.ObjectType
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

data class ObjectFilters(
    val search: String = "",
    val type: ObjectType? = null,
    val possession: PossessionStatus? = null,
    val priceMax: Float? = null,
    val tag: String? = null,
) {
    fun matches(o: ObjectEntity): Boolean {
        if (type != null && o.type != type.name) return false
        if (possession != null && o.possessionStatus != possession.name) return false
        if (priceMax != null && (o.ebayLastPriceEur ?: o.ebayLastPrice ?: 0.0) > priceMax) return false
        if (!tag.isNullOrBlank() && o.tags?.lowercase()?.contains(tag.lowercase()) != true) return false
        if (search.isNotBlank()) {
            val term = search.trim()
            if (!o.name.contains(term, ignoreCase = true) &&
                o.tags?.contains(term, ignoreCase = true) != true
            ) return false
        }
        return true
    }
}

@HiltViewModel
class ObjectsListViewModel @Inject constructor(
    private val repo: ObjectRepository,
) : ViewModel() {
    private val _filters = MutableStateFlow(ObjectFilters())
    val filters: StateFlow<ObjectFilters> = _filters

    val objects: StateFlow<List<ObjectEntity>> =
        combine(repo.all, _filters) { all, f -> all.filter(f::matches) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun setSearch(v: String) { _filters.value = _filters.value.copy(search = v) }
    fun setType(v: ObjectType?) { _filters.value = _filters.value.copy(type = v) }
    fun setPossession(v: PossessionStatus?) { _filters.value = _filters.value.copy(possession = v) }
    fun setPriceMax(v: Float?) { _filters.value = _filters.value.copy(priceMax = v) }
    fun setTag(v: String?) { _filters.value = _filters.value.copy(tag = v?.takeIf { it.isNotBlank() }) }
    fun clear() { _filters.value = ObjectFilters() }

    fun reorder(fromIndex: Int, toIndex: Int) {
        val current = objects.value.toMutableList()
        if (fromIndex !in current.indices || toIndex !in current.indices) return
        val moved = current.removeAt(fromIndex)
        current.add(toIndex, moved)
        viewModelScope.launch {
            current.forEachIndexed { idx, o ->
                if (o.sortOrder != idx) repo.setSortOrder(o.id, idx)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ObjectsListScreen(
    onAdd: () -> Unit,
    onOpen: (String) -> Unit,
    vm: ObjectsListViewModel = hiltViewModel(),
) {
    val objects by vm.objects.collectAsStateWithLifecycle()
    val filters by vm.filters.collectAsStateWithLifecycle()
    var filtersOpen by remember { mutableStateOf(false) }
    val hasActiveFilters = filters.type != null || filters.possession != null ||
        filters.priceMax != null || !filters.tag.isNullOrBlank()

    Scaffold(
        containerColor = ColectaColors.Bg,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Mis objetos", color = ColectaColors.OnBg, fontWeight = FontWeight.Bold)
                        Text(
                            if (objects.isEmpty()) "Aún sin objetos"
                            else "${objects.size} ${if (objects.size == 1) "objeto" else "objetos"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = ColectaColors.OnBgMuted,
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { filtersOpen = true }) {
                        BadgedBox(
                            badge = { if (hasActiveFilters) Badge(containerColor = ColectaColors.Primary) },
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
            ) { Icon(Icons.Filled.Add, contentDescription = "Añadir objeto") }
        },
    ) { inner ->
        Column(modifier = Modifier.padding(inner).padding(horizontal = 16.dp)) {
            SearchBar(value = filters.search, onValueChange = vm::setSearch)
            Spacer(Modifier.height(10.dp))
            if (objects.isEmpty()) {
                EmptyState(
                    emoji = "📦",
                    title = if (hasActiveFilters) "Ningún resultado" else "Sin objetos todavía",
                    description = if (hasActiveFilters) "Cambia o limpia los filtros para ver más."
                    else "Pulsa + para añadir un objeto a tu colección.",
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
                    items(objects, key = { it.id }) { o ->
                        ReorderableItem(reorderState, key = o.id) { isDragging ->
                            ObjectRowItem(
                                o = o,
                                onClick = { onOpen(o.id) },
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
            Column(modifier = Modifier.padding(horizontal = 16.dp).padding(bottom = 24.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "Filtros",
                        style = MaterialTheme.typography.titleMedium,
                        color = ColectaColors.OnBg,
                        modifier = Modifier.weight(1f),
                    )
                    TextButton(onClick = vm::clear) { Text("Limpiar", color = ColectaColors.Primary) }
                }

                SectionTitle("Tipo")
                LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    item { Pill("Todos", active = filters.type == null) { vm.setType(null) } }
                    items(ObjectType.entries) { t ->
                        Pill("${t.emoji} ${t.display}", active = filters.type == t) {
                            vm.setType(if (filters.type == t) null else t)
                        }
                    }
                }

                SectionTitle("Estado")
                LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    item { Pill("Todos", active = filters.possession == null) { vm.setPossession(null) } }
                    items(PossessionStatus.entries) { p ->
                        Pill("${p.emoji()} ${p.label()}", active = filters.possession == p) {
                            vm.setPossession(if (filters.possession == p) null else p)
                        }
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
                    onClick = { filtersOpen = false },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ColectaColors.Primary,
                        contentColor = ColectaColors.OnPrimary,
                    ),
                    shape = RoundedCornerShape(12.dp),
                ) { Text("Aplicar") }
            }
        }
    }
}

@Composable
private fun ObjectRowItem(
    o: ObjectEntity,
    onClick: () -> Unit,
    dragModifier: Modifier = Modifier,
    elevated: Boolean = false,
) {
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
            contentAlignment = Alignment.Center,
        ) {
            if (o.frontImageUri != null) {
                AsyncImage(
                    model = o.frontImageUri,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                )
            } else Text("📦", style = MaterialTheme.typography.titleLarge)
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(o.name, color = ColectaColors.OnBg, style = MaterialTheme.typography.titleSmall, maxLines = 1)
            val t = runCatching { ObjectType.valueOf(o.type) }.getOrNull()
            val tagsCsv = o.tags
            if (t != null || !tagsCsv.isNullOrBlank()) {
                Text(
                    buildString {
                        if (t != null) append("${t.emoji} ${t.display}")
                        if (!tagsCsv.isNullOrBlank()) {
                            if (t != null) append(" · ")
                            append(tagsCsv.split(",").joinToString(" · ") { "#${it.trim()}" })
                        }
                    },
                    color = ColectaColors.OnBgMuted,
                    style = MaterialTheme.typography.labelSmall,
                    maxLines = 1,
                )
            }
        }
        Text(
            formatCurrency(o.ebayLastPrice, o.ebayLastPriceCurrency ?: "EUR"),
            color = ColectaColors.Primary,
            style = MaterialTheme.typography.titleSmall,
        )
    }
}
