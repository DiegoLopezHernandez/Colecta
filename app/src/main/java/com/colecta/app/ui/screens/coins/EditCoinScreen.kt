package com.colecta.app.ui.screens.coins

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.colecta.app.data.db.CoinEntity
import com.colecta.app.data.repo.CoinRepository
import com.colecta.app.domain.model.CoinCategory
import com.colecta.app.domain.model.CoinCondition
import com.colecta.app.domain.model.PossessionStatus
import com.colecta.app.domain.model.emoji
import com.colecta.app.domain.model.label
import com.colecta.app.ui.components.LabeledField
import com.colecta.app.ui.components.PhotoCaptureCard
import com.colecta.app.ui.components.Pill
import com.colecta.app.ui.components.PrimaryButton
import com.colecta.app.ui.components.SectionTitle
import com.colecta.app.ui.components.TagsEditor
import com.colecta.app.ui.theme.ColectaColors
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class EditCoinViewModel @Inject constructor(
    private val repo: CoinRepository,
    savedState: SavedStateHandle,
) : ViewModel() {
    private val id: String = checkNotNull(savedState["id"])
    private val _coin = MutableStateFlow<CoinEntity?>(null)
    val coin: StateFlow<CoinEntity?> = _coin

    init {
        viewModelScope.launch { _coin.value = repo.get(id) }
    }

    fun update(transform: (CoinEntity) -> CoinEntity) {
        _coin.value = _coin.value?.let(transform)
    }

    fun save(onDone: () -> Unit) {
        val c = _coin.value ?: return
        viewModelScope.launch {
            repo.upsert(c)
            onDone()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditCoinScreen(
    onBack: () -> Unit,
    vm: EditCoinViewModel = hiltViewModel(),
) {
    val coin by vm.coin.collectAsStateWithLifecycle()

    Scaffold(
        containerColor = ColectaColors.Bg,
        topBar = {
            TopAppBar(
                title = { Text("Editar moneda", color = ColectaColors.OnBg, fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = ColectaColors.OnBg)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ColectaColors.Bg),
            )
        },
    ) { inner ->
        val c = coin ?: run {
            Box(Modifier.padding(inner).fillMaxSize()) { CircularProgressIndicator() }
            return@Scaffold
        }
        Column(
            modifier = Modifier.padding(inner).padding(16.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            SectionTitle("Identificación")
            LabeledField("Título", c.title, { v -> vm.update { it.copy(title = v) } })
            LabeledField(
                "Año", c.year.toString(),
                { v -> v.toIntOrNull()?.let { y -> vm.update { it.copy(year = y) } } },
                keyboardType = KeyboardType.Number, maxLength = 4,
            )

            SectionTitle("Fotos")
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                PhotoCaptureCard(
                    label = "Anverso",
                    uri = c.frontImageUri,
                    onChange = { v -> vm.update { it.copy(frontImageUri = v) } },
                    modifier = Modifier.weight(1f),
                )
                PhotoCaptureCard(
                    label = "Reverso",
                    uri = c.backImageUri,
                    onChange = { v -> vm.update { it.copy(backImageUri = v) } },
                    modifier = Modifier.weight(1f),
                )
            }

            SectionTitle("Clasificación")
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(CoinCondition.entries.size) { idx ->
                    val v = CoinCondition.entries[idx]
                    Pill(label = v.label(), active = c.condition == v.name) { vm.update { it.copy(condition = v.name) } }
                }
            }
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(CoinCategory.entries.size) { idx ->
                    val v = CoinCategory.entries[idx]
                    Pill(label = "${v.emoji} ${v.display}", active = c.category == v.name) { vm.update { it.copy(category = v.name) } }
                }
            }
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(PossessionStatus.entries.size) { idx ->
                    val v = PossessionStatus.entries[idx]
                    Pill(label = "${v.emoji()} ${v.label()}", active = c.possessionStatus == v.name) {
                        vm.update { it.copy(possessionStatus = v.name) }
                    }
                }
            }

            SectionTitle("Etiquetas")
            TagsEditor(
                csv = c.tags,
                onCsvChange = { v -> vm.update { it.copy(tags = v?.takeIf { it.isNotBlank() }) } },
            )

            SectionTitle("Notas")
            LabeledField(
                "Notas", c.notes.orEmpty(),
                { v -> vm.update { it.copy(notes = v.ifBlank { null }) } },
                singleLine = false,
            )

            Spacer(Modifier.height(8.dp))
            PrimaryButton(label = "Guardar cambios", onClick = { vm.save(onBack) })
        }
    }
}
