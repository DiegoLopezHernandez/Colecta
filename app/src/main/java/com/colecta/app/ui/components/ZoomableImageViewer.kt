package com.colecta.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.colecta.app.ui.theme.ColectaColors

/**
 * Visor de imagen a pantalla completa con:
 *   - Pellizco para zoom (1x a 5x).
 *   - Arrastrar para mover la imagen cuando está ampliada.
 *   - Doble tap: alterna 1x ↔ 2.5x.
 *   - Botón ✕ arriba a la derecha.
 *
 * Implementado sobre `Dialog` para que ocupe toda la pantalla por encima del
 * Scaffold del padre.
 */
@Composable
fun ZoomableImageViewer(uri: String?, onClose: () -> Unit) {
    AnimatedVisibility(visible = uri != null, enter = fadeIn(), exit = fadeOut()) {
        if (uri != null) {
            Dialog(
                onDismissRequest = onClose,
                properties = DialogProperties(usePlatformDefaultWidth = false, dismissOnBackPress = true),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black),
                ) {
                    var scale by remember { mutableStateOf(1f) }
                    var offsetX by remember { mutableStateOf(0f) }
                    var offsetY by remember { mutableStateOf(0f) }

                    val maxScale = 5f
                    val minScale = 1f

                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .pointerInput(Unit) {
                                detectTapGestures(
                                    onDoubleTap = {
                                        if (scale > 1.05f) {
                                            scale = 1f; offsetX = 0f; offsetY = 0f
                                        } else {
                                            scale = 2.5f
                                        }
                                    },
                                )
                            }
                            .pointerInput(Unit) {
                                detectTransformGestures { _, pan, zoom, _ ->
                                    val newScale = (scale * zoom).coerceIn(minScale, maxScale)
                                    scale = newScale
                                    if (newScale > 1f) {
                                        offsetX += pan.x
                                        offsetY += pan.y
                                    } else {
                                        offsetX = 0f
                                        offsetY = 0f
                                    }
                                }
                            },
                        contentAlignment = Alignment.Center,
                    ) {
                        AsyncImage(
                            model = uri,
                            contentDescription = null,
                            modifier = Modifier
                                .fillMaxSize()
                                .graphicsLayer(
                                    scaleX = scale,
                                    scaleY = scale,
                                    translationX = offsetX,
                                    translationY = offsetY,
                                ),
                            contentScale = androidx.compose.ui.layout.ContentScale.Fit,
                        )
                    }

                    IconButton(
                        onClick = onClose,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(top = 32.dp, end = 12.dp)
                            .background(ColectaColors.Overlay, androidx.compose.foundation.shape.CircleShape),
                    ) {
                        Icon(Icons.Outlined.Close, contentDescription = "Cerrar", tint = ColectaColors.OnBg)
                    }

                }
            }
        }
    }
}
