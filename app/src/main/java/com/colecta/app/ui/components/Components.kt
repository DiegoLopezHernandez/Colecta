package com.colecta.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.colecta.app.ui.theme.ColectaColors

/**
 * Componentes UI reutilizables de Colecta. Mantienen el look & feel coherente:
 * superficies sutiles, esquinas redondeadas, acento dorado en interacciones.
 */

@Composable
fun PrimaryButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = modifier.fillMaxWidth().height(48.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = ColectaColors.Primary,
            contentColor = ColectaColors.OnPrimary,
            disabledContainerColor = ColectaColors.Primary.copy(alpha = 0.4f),
            disabledContentColor = ColectaColors.OnPrimary.copy(alpha = 0.6f),
        ),
        shape = RoundedCornerShape(12.dp),
    ) {
        if (loading) {
            CircularProgressIndicator(
                color = ColectaColors.OnPrimary,
                strokeWidth = 2.dp,
                modifier = Modifier.size(18.dp),
            )
        } else {
            Text(label, style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
fun SecondaryButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.fillMaxWidth().height(48.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = ColectaColors.OnBg,
            containerColor = ColectaColors.Surface2,
        ),
        border = BorderStroke(1.dp, ColectaColors.Border),
        shape = RoundedCornerShape(12.dp),
    ) {
        Text(label, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
fun DangerButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Button(
        onClick = onClick,
        modifier = modifier.fillMaxWidth().height(48.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = ColectaColors.Err,
            contentColor = ColectaColors.OnErr,
        ),
        shape = RoundedCornerShape(12.dp),
    ) {
        Text(label, style = MaterialTheme.typography.labelLarge)
    }
}

/**
 * Tarjeta con superficie sutil, borde fino y esquinas suaves.
 * Sustituye al patrón "View con backgroundColor + borderWidth" repetido.
 */
@Composable
fun ColectaCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val shape = RoundedCornerShape(14.dp)
    var m: Modifier = modifier
        .clip(shape)
        .background(ColectaColors.Surface)
        .border(1.dp, ColectaColors.Border, shape)
    if (onClick != null) m = m.clickable(onClick = onClick)
    Column(modifier = m.padding(14.dp), content = content)
}

/** Bloque "vacío" centrado: emoji + título + descripción opcional. */
@Composable
fun EmptyState(
    emoji: String,
    title: String,
    description: String? = null,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(ColectaColors.Surface)
                .border(1.dp, ColectaColors.Border, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(emoji, style = MaterialTheme.typography.titleLarge)
        }
        Spacer(Modifier.height(16.dp))
        Text(
            title,
            style = MaterialTheme.typography.titleMedium,
            color = ColectaColors.OnBg,
            textAlign = TextAlign.Center,
        )
        if (description != null) {
            Spacer(Modifier.height(6.dp))
            Text(
                description,
                style = MaterialTheme.typography.bodySmall,
                color = ColectaColors.OnBgMuted,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
fun LoadingView(label: String? = null, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxSize().background(ColectaColors.Bg),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        CircularProgressIndicator(color = ColectaColors.Primary)
        if (label != null) {
            Spacer(Modifier.height(12.dp))
            Text(label, color = ColectaColors.OnBgMuted, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
fun SearchBar(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = "Buscar…",
    modifier: Modifier = Modifier,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth(),
        placeholder = { Text(placeholder, color = ColectaColors.OnBgSubtle) },
        leadingIcon = {
            Icon(
                Icons.Outlined.Search,
                contentDescription = null,
                tint = ColectaColors.OnBgMuted,
            )
        },
        singleLine = true,
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
}

/** Campo de texto con etiqueta superior en mayúsculas finas. */
@Composable
fun LabeledField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
    maxLength: Int? = null,
) {
    Column(modifier = modifier) {
        Text(
            label.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = ColectaColors.OnBgMuted,
            modifier = Modifier.padding(bottom = 6.dp),
        )
        OutlinedTextField(
            value = value,
            onValueChange = { new -> onValueChange(if (maxLength != null) new.take(maxLength) else new) },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text(placeholder, color = ColectaColors.OnBgSubtle) },
            singleLine = singleLine,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
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
    }
}

@Composable
fun Pill(
    label: String,
    active: Boolean = false,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val bg = if (active) ColectaColors.Primary else ColectaColors.Surface2
    val fg = if (active) ColectaColors.OnPrimary else ColectaColors.OnBg
    Surface(
        onClick = onClick,
        modifier = modifier,
        color = bg,
        contentColor = fg,
        shape = RoundedCornerShape(999.dp),
        border = BorderStroke(1.dp, if (active) ColectaColors.Primary else ColectaColors.Border),
    ) {
        Text(
            label,
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
        )
    }
}

@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier) {
    Text(
        text.uppercase(),
        style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 1.sp),
        color = ColectaColors.OnBgMuted,
        modifier = modifier.padding(top = 8.dp, bottom = 8.dp),
    )
}

@Composable
fun DataRow(k: String, v: String?, last: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Text(
            k,
            color = ColectaColors.OnBgMuted,
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.width(110.dp),
        )
        Text(
            v ?: "—",
            color = ColectaColors.OnBg,
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.End,
            modifier = Modifier.weight(1f),
        )
    }
    if (!last) {
        HorizontalDivider(color = ColectaColors.BorderSubtle)
    }
}
