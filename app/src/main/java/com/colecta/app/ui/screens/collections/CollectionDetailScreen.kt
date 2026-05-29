package com.colecta.app.ui.screens.collections

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.Delete
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
import com.colecta.app.data.db.CollectionEntity
import com.colecta.app.data.repo.CollectionRepository
import com.colecta.app.ui.components.EmptyState
import com.colecta.app.ui.theme.ColectaColors
import com.colecta.app.util.formatCurrency
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@HiltViewModel
class CollectionDetailViewModel @Inject constructor(
    private val repo: CollectionRepository,
    savedState: SavedStateHandle,
) : ViewModel() {
    private val id: String = checkNotNull(savedState["id"])
    private val _entity = MutableStateFlow<CollectionEntity?>(null)
    val entity: StateFlow<CollectionEntity?> = _entity

    @OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
    val coins: StateFlow<List<CoinEntity>> =
        MutableStateFlow(id).flatMapLatest { repo.coinsIn(it) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init { viewModelScope.launch { _entity.value = repo.get(id) } }

    fun delete(onDone: () -> Unit) {
        viewModelScope.launch { repo.delete(id); onDone() }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CollectionDetailScreen(
    onBack: () -> Unit,
    onOpenCoin: (String) -> Unit,
    vm: CollectionDetailViewModel = hiltViewModel(),
) {
    val entity by vm.entity.collectAsStateWithLifecycle()
    val coins by vm.coins.collectAsStateWithLifecycle()
    var confirmDelete by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = ColectaColors.Bg,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            entity?.let { "${it.emoji} ${it.name}" } ?: "Álbum",
                            color = ColectaColors.OnBg,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1,
                        )
                        Text(
                            "${coins.size} ${if (coins.size == 1) "moneda" else "monedas"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = ColectaColors.OnBgMuted,
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = ColectaColors.OnBg)
                    }
                },
                actions = {
                    IconButton(onClick = { confirmDelete = true }) {
                        Icon(Icons.Outlined.Delete, contentDescription = "Eliminar álbum", tint = ColectaColors.Err)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ColectaColors.Bg),
            )
        },
    ) { inner ->
        Column(modifier = Modifier.padding(inner)) {
            if (!entity?.description.isNullOrBlank()) {
                Text(
                    entity?.description.orEmpty(),
                    color = ColectaColors.OnBgMuted,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                )
            }
            if (coins.isEmpty()) {
                EmptyState(
                    emoji = "📭",
                    title = "Álbum vacío",
                    description = "Abre una moneda y úsala para añadirla a este álbum.",
                )
            } else {
                LazyColumn(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 16.dp),
                ) {
                    items(coins, key = { it.id }) { c ->
                        CoinMiniRow(c, onClick = { onOpenCoin(c.id) })
                    }
                }
            }
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
            title = { Text("Eliminar álbum") },
            text = { Text("Las monedas no se borran, solo dejarán de pertenecer al álbum.") },
            containerColor = ColectaColors.Surface,
        )
    }
}

@Composable
private fun CoinMiniRow(coin: CoinEntity, onClick: () -> Unit) {
    val shape = RoundedCornerShape(12.dp)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(ColectaColors.Surface)
            .border(1.dp, ColectaColors.Border, shape)
            .clickable(onClick = onClick)
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier.size(56.dp).clip(RoundedCornerShape(8.dp)).background(ColectaColors.Surface2),
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
        Spacer(Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(coin.title, color = ColectaColors.OnBg, style = MaterialTheme.typography.titleSmall, maxLines = 1)
            Text(
                "${coin.country} · ${coin.year}",
                color = ColectaColors.OnBgMuted,
                style = MaterialTheme.typography.bodySmall,
            )
        }
        val price = coin.ebayLastPrice ?: coin.numistaTypicalValue
        if (price != null) {
            Text(
                formatCurrency(price, coin.ebayLastPriceCurrency ?: "EUR"),
                color = ColectaColors.Primary,
                style = MaterialTheme.typography.titleSmall,
            )
        }
    }
}
