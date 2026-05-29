package com.colecta.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import com.colecta.app.ui.theme.ColectaColors

/**
 * Editor de etiquetas libres. Acepta un string CSV ("rara,regalo,1euro") y
 * notifica cambios en la misma codificación.
 *
 * UX: chips clicables con ✕ para borrar + input al final. Pulsar enter o coma
 * añade la tag actual. Se eliminan espacios y duplicados.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TagsEditor(
    csv: String?,
    onCsvChange: (String?) -> Unit,
    modifier: Modifier = Modifier,
) {
    val tags = remember(csv) { parseTags(csv) }
    var draft by remember { mutableStateOf("") }

    fun commit() {
        val t = draft.trim().trimEnd(',').trim()
        if (t.isEmpty()) return
        if (tags.any { it.equals(t, ignoreCase = true) }) { draft = ""; return }
        val next = (tags + t).joinToString(",")
        onCsvChange(next)
        draft = ""
    }

    Column(modifier = modifier) {
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            tags.forEach { tag ->
                AssistChip(
                    onClick = {
                        val next = tags.filterNot { it.equals(tag, ignoreCase = true) }
                        onCsvChange(next.takeIf { it.isNotEmpty() }?.joinToString(","))
                    },
                    label = { Text(tag) },
                    trailingIcon = {
                        Icon(Icons.Outlined.Close, contentDescription = "Quitar $tag", modifier = Modifier.size(16.dp))
                    },
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = ColectaColors.Surface2,
                        labelColor = ColectaColors.OnBg,
                        leadingIconContentColor = ColectaColors.OnBgMuted,
                        trailingIconContentColor = ColectaColors.OnBgMuted,
                    ),
                    border = BorderStroke(1.dp, ColectaColors.Border),
                    shape = RoundedCornerShape(999.dp),
                )
            }
        }
        Spacer(Modifier.height(6.dp))
        OutlinedTextField(
            value = draft,
            onValueChange = { v ->
                // Aceptar comas como separadores
                if (v.endsWith(",")) {
                    draft = v.dropLast(1)
                    commit()
                } else draft = v
            },
            placeholder = { Text("Añadir etiqueta…", color = ColectaColors.OnBgSubtle) },
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.None,
                imeAction = ImeAction.Done,
            ),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = ColectaColors.Surface2,
                unfocusedContainerColor = ColectaColors.Surface2,
                focusedBorderColor = ColectaColors.Primary,
                unfocusedBorderColor = ColectaColors.Border,
                focusedTextColor = ColectaColors.OnBg,
                unfocusedTextColor = ColectaColors.OnBg,
            ),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth(),
            trailingIcon = {
                if (draft.isNotBlank()) {
                    TextButton(onClick = { commit() }) { Text("Añadir", color = ColectaColors.Primary) }
                }
            },
        )
    }
}

fun parseTags(csv: String?): List<String> =
    csv?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() }?.distinct().orEmpty()
