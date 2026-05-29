package com.colecta.app.ui.screens.collections

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.colecta.app.data.db.CollectionEntity
import com.colecta.app.data.repo.CollectionRepository
import com.colecta.app.ui.components.EmptyState
import com.colecta.app.ui.components.LabeledField
import com.colecta.app.ui.components.PrimaryButton
import com.colecta.app.ui.theme.ColectaColors
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class SelectCollectionsUiState(
    val all: List<CollectionEntity> = emptyList(),
    val selected: Set<String> = emptySet(),
    val coinId: String = "",
)

@HiltViewModel
class SelectCollectionsViewModel @Inject constructor(
    private val repo: CollectionRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(SelectCollectionsUiState())
    val state: StateFlow<SelectCollectionsUiState> = _state

    init {
        viewModelScope.launch {
            repo.all.collect { list ->
                _state.value = _state.value.copy(all = list)
            }
        }
    }

    fun load(coinId: String) {
        viewModelScope.launch {
            val selected = repo.collectionsOf(coinId).toSet()
            _state.value = _state.value.copy(coinId = coinId, selected = selected)
        }
    }

    fun toggle(collectionId: String) {
        val s = _state.value.selected
        _state.value = _state.value.copy(
            selected = if (s.contains(collectionId)) s - collectionId else s + collectionId,
        )
    }

    fun save(onDone: () -> Unit) {
        val s = _state.value
        if (s.coinId.isBlank()) return
        viewModelScope.launch {
            repo.setMembership(s.coinId, s.selected)
            onDone()
        }
    }

    fun create(name: String, emoji: String) {
        if (name.isBlank()) return
        viewModelScope.launch {
            val c = repo.create(name, null, emoji.ifBlank { "📁" })
            _state.value = _state.value.copy(selected = _state.value.selected + c.id)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SelectCollectionsSheet(
    coinId: String,
    onDismiss: () -> Unit,
    vm: SelectCollectionsViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    var createOpen by remember { mutableStateOf(false) }

    LaunchedEffect(coinId) { vm.load(coinId) }

    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = ColectaColors.Surface) {
        Column(modifier = Modifier.padding(horizontal = 16.dp).padding(bottom = 24.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "Álbumes",
                    style = MaterialTheme.typography.titleMedium,
                    color = ColectaColors.OnBg,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f),
                )
                TextButton(onClick = { createOpen = true }) { Text("Nuevo", color = ColectaColors.Primary) }
            }
            Spacer(Modifier.height(8.dp))
            if (state.all.isEmpty()) {
                EmptyState(
                    emoji = "📁",
                    title = "Sin álbumes",
                    description = "Pulsa Nuevo para crear el primero.",
                    modifier = Modifier.heightIn(min = 200.dp),
                )
            } else {
                LazyColumn(
                    modifier = Modifier.heightIn(max = 400.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    items(state.all, key = { it.id }) { c ->
                        val checked = state.selected.contains(c.id)
                        Surface(
                            onClick = { vm.toggle(c.id) },
                            color = if (checked) ColectaColors.Surface3 else ColectaColors.Surface2,
                            shape = RoundedCornerShape(12.dp),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (checked) ColectaColors.Primary else ColectaColors.Border,
                            ),
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(c.emoji, style = MaterialTheme.typography.titleMedium)
                                Spacer(Modifier.width(10.dp))
                                Text(c.name, color = ColectaColors.OnBg, modifier = Modifier.weight(1f))
                                Checkbox(
                                    checked = checked,
                                    onCheckedChange = { vm.toggle(c.id) },
                                    colors = CheckboxDefaults.colors(
                                        checkedColor = ColectaColors.Primary,
                                        uncheckedColor = ColectaColors.Border,
                                    ),
                                )
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            PrimaryButton(label = "Guardar", onClick = { vm.save(onDismiss) })
        }
    }

    if (createOpen) {
        var name by remember { mutableStateOf("") }
        var emoji by remember { mutableStateOf("📁") }
        AlertDialog(
            onDismissRequest = { createOpen = false },
            confirmButton = {
                TextButton(
                    enabled = name.isNotBlank(),
                    onClick = {
                        vm.create(name, emoji)
                        createOpen = false
                    },
                ) { Text("Crear", color = ColectaColors.Primary) }
            },
            dismissButton = { TextButton(onClick = { createOpen = false }) { Text("Cancelar") } },
            title = { Text("Nuevo álbum") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    LabeledField("Nombre", name, { name = it }, placeholder = "Ej: 2 € conmemorativos")
                    LabeledField("Emoji", emoji, { emoji = it.take(2) }, placeholder = "📁")
                }
            },
            containerColor = ColectaColors.Surface,
        )
    }
}
