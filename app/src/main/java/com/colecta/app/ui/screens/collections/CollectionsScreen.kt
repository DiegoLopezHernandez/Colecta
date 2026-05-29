package com.colecta.app.ui.screens.collections

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
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
import com.colecta.app.data.db.CollectionEntity
import com.colecta.app.data.repo.CollectionRepository
import com.colecta.app.ui.components.EmptyState
import com.colecta.app.ui.components.LabeledField
import com.colecta.app.ui.components.PrimaryButton
import com.colecta.app.ui.components.SecondaryButton
import com.colecta.app.ui.theme.ColectaColors
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class CollectionsUiState(
    val items: List<CollectionEntity> = emptyList(),
    val counts: Map<String, Int> = emptyMap(),
)

@HiltViewModel
class CollectionsViewModel @Inject constructor(
    private val repo: CollectionRepository,
) : ViewModel() {
    val state: StateFlow<CollectionsUiState> = combine(repo.all, repo.counts) { items, counts ->
        CollectionsUiState(items, counts)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), CollectionsUiState())

    fun create(name: String, description: String?, emoji: String) {
        if (name.isBlank()) return
        viewModelScope.launch { repo.create(name, description, emoji.ifBlank { "📁" }) }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CollectionsScreen(
    onOpen: (String) -> Unit,
    vm: CollectionsViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    var createOpen by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = ColectaColors.Bg,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Álbumes", color = ColectaColors.OnBg, fontWeight = FontWeight.Bold)
                        Text(
                            if (state.items.isEmpty()) "Crea tu primer álbum temático"
                            else "${state.items.size} álbum${if (state.items.size == 1) "" else "es"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = ColectaColors.OnBgMuted,
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ColectaColors.Bg),
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { createOpen = true },
                containerColor = ColectaColors.Primary,
                contentColor = ColectaColors.OnPrimary,
            ) { Icon(Icons.Filled.Add, contentDescription = "Nuevo álbum") }
        },
    ) { inner ->
        if (state.items.isEmpty()) {
            EmptyState(
                modifier = Modifier.padding(inner),
                emoji = "📁",
                title = "Sin álbumes todavía",
                description = "Agrupa monedas en colecciones temáticas: \"Euros conmemorativos\", \"Mi serie 2 €\", etc.",
            )
        } else {
            LazyColumn(
                modifier = Modifier.padding(inner).padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(top = 8.dp, bottom = 96.dp),
            ) {
                items(state.items, key = { it.id }) { c ->
                    CollectionRow(
                        item = c,
                        count = state.counts[c.id] ?: 0,
                        onClick = { onOpen(c.id) },
                    )
                }
            }
        }
    }

    if (createOpen) {
        CreateCollectionDialog(
            onDismiss = { createOpen = false },
            onCreate = { name, desc, emoji ->
                vm.create(name, desc, emoji)
                createOpen = false
            },
        )
    }
}

@Composable
private fun CollectionRow(item: CollectionEntity, count: Int, onClick: () -> Unit) {
    val shape = RoundedCornerShape(14.dp)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(ColectaColors.Surface)
            .border(1.dp, ColectaColors.Border, shape)
            .clickable(onClick = onClick)
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(item.emoji, style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(item.name, color = ColectaColors.OnBg, style = MaterialTheme.typography.titleSmall)
            if (!item.description.isNullOrBlank()) {
                Text(
                    item.description,
                    color = ColectaColors.OnBgMuted,
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 1,
                )
            }
        }
        AssistChip(
            onClick = onClick,
            label = { Text("$count") },
            colors = AssistChipDefaults.assistChipColors(
                containerColor = ColectaColors.Surface2,
                labelColor = ColectaColors.OnBg,
            ),
            border = AssistChipDefaults.assistChipBorder(enabled = true, borderColor = ColectaColors.Border),
        )
    }
}

@Composable
private fun CreateCollectionDialog(
    onDismiss: () -> Unit,
    onCreate: (name: String, description: String?, emoji: String) -> Unit,
) {
    var name by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var emoji by remember { mutableStateOf("📁") }
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(
                onClick = { onCreate(name, desc.ifBlank { null }, emoji) },
                enabled = name.isNotBlank(),
            ) { Text("Crear", color = ColectaColors.Primary) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } },
        title = { Text("Nuevo álbum") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                LabeledField("Nombre", name, { name = it }, placeholder = "Ej: Euros conmemorativos")
                LabeledField("Emoji", emoji, { emoji = it.take(2) }, placeholder = "📁")
                LabeledField("Descripción (opcional)", desc, { desc = it }, singleLine = false, placeholder = "Opcional…")
            }
        },
        containerColor = ColectaColors.Surface,
    )
}
