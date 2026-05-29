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
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.colecta.app.data.db.ObjectEntity
import com.colecta.app.data.repo.ObjectRepository
import com.colecta.app.domain.model.ObjectType
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
class EditObjectViewModel @Inject constructor(
    private val repo: ObjectRepository,
    savedState: SavedStateHandle,
) : ViewModel() {
    private val id: String = checkNotNull(savedState["id"])
    private val _obj = MutableStateFlow<ObjectEntity?>(null)
    val obj: StateFlow<ObjectEntity?> = _obj

    init { viewModelScope.launch { _obj.value = repo.get(id) } }

    fun update(transform: (ObjectEntity) -> ObjectEntity) {
        _obj.value = _obj.value?.let(transform)
    }

    fun save(onDone: () -> Unit) {
        val o = _obj.value ?: return
        viewModelScope.launch { repo.upsert(o); onDone() }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditObjectScreen(
    onBack: () -> Unit,
    vm: EditObjectViewModel = hiltViewModel(),
) {
    val obj by vm.obj.collectAsStateWithLifecycle()

    Scaffold(
        containerColor = ColectaColors.Bg,
        topBar = {
            TopAppBar(
                title = { Text("Editar objeto", color = ColectaColors.OnBg, fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = ColectaColors.OnBg)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ColectaColors.Bg),
            )
        },
    ) { inner ->
        val o = obj ?: run {
            Box(Modifier.padding(inner).fillMaxSize()) { CircularProgressIndicator() }
            return@Scaffold
        }
        Column(
            modifier = Modifier.padding(inner).padding(16.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            SectionTitle("Datos")
            LabeledField("Nombre", o.name, { v -> vm.update { it.copy(name = v) } })

            SectionTitle("Fotos")
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                PhotoCaptureCard(
                    label = "Principal",
                    uri = o.frontImageUri,
                    onChange = { v -> vm.update { it.copy(frontImageUri = v) } },
                    modifier = Modifier.weight(1f),
                )
                PhotoCaptureCard(
                    label = "Secundaria",
                    uri = o.backImageUri,
                    onChange = { v -> vm.update { it.copy(backImageUri = v) } },
                    modifier = Modifier.weight(1f),
                )
            }

            SectionTitle("Tipo")
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(ObjectType.entries) { t ->
                    Pill(label = "${t.emoji} ${t.display}", active = o.type == t.name) {
                        vm.update { it.copy(type = t.name) }
                    }
                }
            }

            SectionTitle("Estado")
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(PossessionStatus.entries) { p ->
                    Pill(label = "${p.emoji()} ${p.label()}", active = o.possessionStatus == p.name) {
                        vm.update { it.copy(possessionStatus = p.name) }
                    }
                }
            }

            SectionTitle("Etiquetas")
            TagsEditor(
                csv = o.tags,
                onCsvChange = { v -> vm.update { it.copy(tags = v?.takeIf { it.isNotBlank() }) } },
            )

            SectionTitle("Notas")
            LabeledField(
                "Notas",
                o.notes.orEmpty(),
                { v -> vm.update { it.copy(notes = v.ifBlank { null }) } },
                singleLine = false,
            )

            Spacer(Modifier.height(8.dp))
            PrimaryButton(label = "Guardar cambios", onClick = { vm.save(onBack) })
        }
    }
}
