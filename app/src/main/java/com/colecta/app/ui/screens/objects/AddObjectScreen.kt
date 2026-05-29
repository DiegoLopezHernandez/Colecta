package com.colecta.app.ui.screens.objects

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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.colecta.app.data.db.ObjectEntity
import com.colecta.app.data.prefs.SettingsRepository
import com.colecta.app.data.repo.FxRepository
import com.colecta.app.data.repo.IdentificationRepository
import com.colecta.app.data.repo.ObjectRepository
import com.colecta.app.domain.model.EbayPrice
import com.colecta.app.domain.model.ObjectType
import com.colecta.app.domain.model.PossessionStatus
import com.colecta.app.domain.model.emoji
import com.colecta.app.domain.model.label
import com.colecta.app.ui.components.LabeledField
import com.colecta.app.ui.components.PhotoCaptureCard
import com.colecta.app.ui.components.Pill
import com.colecta.app.ui.components.PrimaryButton
import com.colecta.app.ui.components.SecondaryButton
import com.colecta.app.ui.components.SectionTitle
import com.colecta.app.ui.components.TagsEditor
import com.colecta.app.ui.theme.ColectaColors
import com.colecta.app.util.formatCurrency
import com.colecta.app.util.nowIso
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.util.UUID

data class AddObjectUiState(
    val name: String = "",
    val frontUri: String? = null,
    val backUri: String? = null,
    val type: ObjectType = ObjectType.OTHER,
    val possession: PossessionStatus = PossessionStatus.OWNED,
    val tagsCsv: String? = null,
    val notes: String = "",
    val ebayPrice: EbayPrice? = null,
    val ebayChecked: Boolean = false,
    val loading: Boolean = false,
    val error: String? = null,
)

@HiltViewModel
class AddObjectViewModel @Inject constructor(
    private val repo: ObjectRepository,
    private val identification: IdentificationRepository,
    private val settings: SettingsRepository,
    private val fx: FxRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(AddObjectUiState())
    val state: StateFlow<AddObjectUiState> = _state

    fun setName(v: String) { _state.value = _state.value.copy(name = v) }
    fun setFront(u: String?) { _state.value = _state.value.copy(frontUri = u) }
    fun setBack(u: String?) { _state.value = _state.value.copy(backUri = u) }
    fun setType(t: ObjectType) { _state.value = _state.value.copy(type = t) }
    fun setPossession(p: PossessionStatus) { _state.value = _state.value.copy(possession = p) }
    fun setTags(v: String?) { _state.value = _state.value.copy(tagsCsv = v) }
    fun setNotes(n: String) { _state.value = _state.value.copy(notes = n) }

    fun queryEbay() {
        val n = _state.value.name
        if (n.isBlank()) {
            _state.value = _state.value.copy(error = "Introduce un nombre.")
            return
        }
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            val keys = settings.keys.first()
            val res = identification.fetchEbayPrice(keys.ebayAppId, n)
            _state.value = _state.value.copy(
                loading = false,
                ebayPrice = res.getOrNull(),
                ebayChecked = true,
                error = res.exceptionOrNull()?.message,
            )
        }
    }

    fun save(onDone: () -> Unit) {
        val s = _state.value
        if (s.name.isBlank()) {
            _state.value = s.copy(error = "Introduce un nombre.")
            return
        }
        viewModelScope.launch {
            val priceEur = s.ebayPrice?.let { fx.toEur(it.price, it.currency) }
            val entity = ObjectEntity(
                id = UUID.randomUUID().toString(),
                name = s.name.trim(),
                type = s.type.name,
                ebayLastPrice = s.ebayPrice?.price,
                ebayLastPriceCurrency = s.ebayPrice?.currency,
                ebayLastPriceDate = s.ebayPrice?.endDate,
                ebayLastPriceUpdatedAt = if (s.ebayPrice != null) nowIso() else null,
                ebayLastPriceEur = priceEur,
                ebayPriceNotFound = s.ebayChecked && s.ebayPrice == null,
                frontImageUri = s.frontUri,
                backImageUri = s.backUri,
                possessionStatus = s.possession.name,
                tags = s.tagsCsv?.takeIf { it.isNotBlank() },
                notes = s.notes.ifBlank { null },
                createdAt = nowIso(),
                updatedAt = nowIso(),
            )
            repo.upsert(entity)
            onDone()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddObjectScreen(
    onBack: () -> Unit,
    vm: AddObjectViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Scaffold(
        containerColor = ColectaColors.Bg,
        topBar = {
            TopAppBar(
                title = { Text("Nuevo objeto", color = ColectaColors.OnBg, fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = ColectaColors.OnBg)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ColectaColors.Bg),
            )
        },
    ) { inner ->
        Column(
            modifier = Modifier.padding(inner).padding(16.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            SectionTitle("Fotografías")
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                PhotoCaptureCard("Principal", state.frontUri, vm::setFront, Modifier.weight(1f))
                PhotoCaptureCard("Secundaria", state.backUri, vm::setBack, Modifier.weight(1f))
            }

            SectionTitle("Datos")
            LabeledField("Nombre", state.name, vm::setName, placeholder = "Ej: Pikachu Holo 1999 #25")

            SectionTitle("Tipo")
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(ObjectType.entries.size) { idx ->
                    val t = ObjectType.entries[idx]
                    Pill(label = "${t.emoji} ${t.display}", active = state.type == t) { vm.setType(t) }
                }
            }

            SectionTitle("Estado")
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(PossessionStatus.entries.size) { idx ->
                    val p = PossessionStatus.entries[idx]
                    Pill(label = "${p.emoji()} ${p.label()}", active = state.possession == p) { vm.setPossession(p) }
                }
            }

            SectionTitle("Precio eBay (opcional)")
            SecondaryButton(label = if (state.loading) "Buscando…" else "Consultar precio eBay", onClick = vm::queryEbay)
            if (state.ebayChecked) {
                when (val p = state.ebayPrice) {
                    null -> Text("Sin resultados en eBay", color = ColectaColors.Warn, style = MaterialTheme.typography.bodySmall)
                    else -> Text(
                        "Último precio: ${formatCurrency(p.price, p.currency)}",
                        color = ColectaColors.Primary,
                        style = MaterialTheme.typography.titleSmall,
                    )
                }
            }

            SectionTitle("Etiquetas")
            TagsEditor(csv = state.tagsCsv, onCsvChange = vm::setTags)

            SectionTitle("Notas")
            LabeledField("Notas", state.notes, vm::setNotes, placeholder = "Opcional…", singleLine = false)

            state.error?.let { Text(it, color = ColectaColors.Err, style = MaterialTheme.typography.bodySmall) }

            Spacer(Modifier.height(8.dp))
            PrimaryButton(label = "Guardar objeto", onClick = { vm.save(onBack) })
        }
    }
}
