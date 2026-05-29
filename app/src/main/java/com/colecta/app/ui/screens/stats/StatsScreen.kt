package com.colecta.app.ui.screens.stats

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.colecta.app.data.db.CoinEntity
import com.colecta.app.data.db.ObjectEntity
import com.colecta.app.data.repo.CoinRepository
import com.colecta.app.data.repo.ObjectRepository
import com.colecta.app.domain.model.CoinCategory
import com.colecta.app.ui.components.ColectaCard
import com.colecta.app.ui.components.DataRow
import com.colecta.app.ui.components.EmptyState
import com.colecta.app.ui.components.SectionTitle
import com.colecta.app.ui.theme.ColectaColors
import com.colecta.app.util.formatCurrency
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

data class StatsUiState(
    val coins: List<CoinEntity> = emptyList(),
    val objects: List<ObjectEntity> = emptyList(),
) {
    // Totales SIEMPRE en EUR (convertidos al actualizar precios). Si un item
    // tiene `ebayLastPriceEur` null, no se cuenta (el llamante puede ver el ✕).
    val totalEbayCoins: Double = coins.sumOf { it.ebayLastPriceEur ?: 0.0 }
    val totalNumistaCoins: Double = coins.sumOf { it.numistaTypicalValue ?: 0.0 }
    val totalEbayObjects: Double = objects.sumOf { it.ebayLastPriceEur ?: 0.0 }
    val grandTotal: Double = totalEbayCoins + totalEbayObjects

    /** Cuántos items tienen precio en otra divisa sin conversión (red caída, etc.). */
    val unconvertedCount: Int =
        coins.count { it.ebayLastPrice != null && it.ebayLastPriceEur == null } +
            objects.count { it.ebayLastPrice != null && it.ebayLastPriceEur == null }

    val mostValuableCoin: CoinEntity? = coins
        .filter { (it.ebayLastPriceEur ?: it.numistaTypicalValue) != null }
        .maxByOrNull { it.ebayLastPriceEur ?: it.numistaTypicalValue ?: 0.0 }

    val mostValuableObject: ObjectEntity? = objects
        .filter { it.ebayLastPriceEur != null }
        .maxByOrNull { it.ebayLastPriceEur ?: 0.0 }

    val coinsByCategory: Map<String, Int> = coins.groupingBy { it.category }.eachCount()
}

@HiltViewModel
class StatsViewModel @Inject constructor(
    coins: CoinRepository,
    objects: ObjectRepository,
) : ViewModel() {
    val state: StateFlow<StatsUiState> =
        combine(coins.all, objects.all) { c, o -> StatsUiState(c, o) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), StatsUiState())
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StatsScreen(vm: StatsViewModel = hiltViewModel()) {
    val s by vm.state.collectAsStateWithLifecycle()

    Scaffold(
        containerColor = ColectaColors.Bg,
        topBar = {
            TopAppBar(
                title = { Text("Estadísticas", color = ColectaColors.OnBg, fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ColectaColors.Bg),
            )
        },
    ) { inner ->
        if (s.coins.isEmpty() && s.objects.isEmpty()) {
            EmptyState(
                modifier = Modifier.padding(inner),
                emoji = "📊",
                title = "Aún no hay datos",
                description = "Añade monedas u objetos para ver estadísticas.",
            )
            return@Scaffold
        }
        Column(
            modifier = Modifier.padding(inner).padding(16.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            SectionTitle("Valor total")
            ColectaCard {
                Text(
                    formatCurrency(s.grandTotal, "EUR"),
                    color = ColectaColors.Primary,
                    style = MaterialTheme.typography.titleLarge,
                )
                Text(
                    "Suma de precios eBay convertidos a EUR.",
                    color = ColectaColors.OnBgMuted,
                    style = MaterialTheme.typography.bodySmall,
                )
                if (s.unconvertedCount > 0) {
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "⚠ ${s.unconvertedCount} ${if (s.unconvertedCount == 1) "pieza" else "piezas"} sin convertir (vuelve a actualizar precio con red).",
                        color = ColectaColors.Warn,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }

            SectionTitle("Resumen")
            ColectaCard {
                DataRow("Monedas", s.coins.size.toString())
                DataRow("Objetos", s.objects.size.toString())
                DataRow("eBay monedas", formatCurrency(s.totalEbayCoins, "EUR"))
                DataRow("Numista monedas", formatCurrency(s.totalNumistaCoins, "EUR"))
                DataRow("eBay objetos", formatCurrency(s.totalEbayObjects, "EUR"), last = true)
            }

            s.mostValuableCoin?.let { c ->
                SectionTitle("Moneda más valiosa")
                ColectaCard {
                    Text(c.title, color = ColectaColors.OnBg, style = MaterialTheme.typography.titleSmall)
                    Text(
                        formatCurrency(c.ebayLastPrice ?: c.numistaTypicalValue, c.ebayLastPriceCurrency ?: "EUR"),
                        color = ColectaColors.Primary,
                        style = MaterialTheme.typography.titleMedium,
                    )
                }
            }
            s.mostValuableObject?.let { o ->
                SectionTitle("Objeto más valioso")
                ColectaCard {
                    Text(o.name, color = ColectaColors.OnBg, style = MaterialTheme.typography.titleSmall)
                    Text(
                        formatCurrency(o.ebayLastPrice, o.ebayLastPriceCurrency ?: "EUR"),
                        color = ColectaColors.Primary,
                        style = MaterialTheme.typography.titleMedium,
                    )
                }
            }

            if (s.coinsByCategory.isNotEmpty()) {
                SectionTitle("Monedas por categoría")
                ColectaCard {
                    val items = s.coinsByCategory.entries.sortedByDescending { it.value }
                    items.forEachIndexed { i, e ->
                        val name = runCatching { CoinCategory.valueOf(e.key).display }.getOrDefault(e.key)
                        DataRow(name, e.value.toString(), last = i == items.size - 1)
                    }
                }
            }
        }
    }
}
