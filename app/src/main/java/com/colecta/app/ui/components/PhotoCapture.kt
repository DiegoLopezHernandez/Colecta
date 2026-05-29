package com.colecta.app.ui.components

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CameraAlt
import androidx.compose.material.icons.outlined.PhotoLibrary
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import coil.compose.AsyncImage
import com.colecta.app.ui.theme.ColectaColors
import com.colecta.app.util.ImageUtil
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Card de captura de foto. Pulsable → ofrece cámara o galería.
 *
 * Implementación:
 *  - Cámara: contrato `TakePicture` (intent al sistema). Crea un fichero
 *    temporal accesible vía FileProvider y devuelve true si se guardó.
 *  - Galería: contrato `PickVisualMedia` (selector moderno, no requiere permiso).
 *
 * Tras una captura/selección la imagen se persiste a `filesDir/photos/<uuid>.jpg`
 * con redimensionado a 1600px y compresión JPEG calidad 80.
 */
@Composable
fun PhotoCaptureCard(
    label: String,
    uri: String?,
    onChange: (String?) -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var sheetOpen by remember { mutableStateOf(false) }
    var pendingCameraUri by remember { mutableStateOf<Uri?>(null) }
    var processing by remember { mutableStateOf(false) }

    val cameraLauncher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        val source = pendingCameraUri
        pendingCameraUri = null
        if (ok && source != null) {
            scope.launch {
                processing = true
                val persisted = withContext(Dispatchers.IO) { ImageUtil.persistFromUri(context, source) }
                processing = false
                if (persisted != null) onChange(persisted)
            }
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) {
            val u = newCameraOutputUri(context)
            pendingCameraUri = u
            cameraLauncher.launch(u)
        }
    }

    val galleryLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia(),
    ) { picked ->
        if (picked != null) {
            scope.launch {
                processing = true
                val persisted = withContext(Dispatchers.IO) { ImageUtil.persistFromUri(context, picked) }
                processing = false
                if (persisted != null) onChange(persisted)
            }
        }
    }

    fun openCamera() {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            val u = newCameraOutputUri(context)
            pendingCameraUri = u
            cameraLauncher.launch(u)
        } else {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    val shape = RoundedCornerShape(14.dp)
    Column(
        modifier = modifier
            .clip(shape)
            .background(ColectaColors.Surface)
            .border(1.dp, ColectaColors.Border, shape)
            .padding(10.dp),
    ) {
        Text(
            label.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = ColectaColors.OnBgMuted,
            modifier = Modifier.padding(bottom = 8.dp),
        )
        Surface(
            onClick = { sheetOpen = true },
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f),
            color = ColectaColors.Surface2,
            shape = RoundedCornerShape(10.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ColectaColors.Border),
        ) {
            if (uri != null) {
                AsyncImage(
                    model = uri,
                    contentDescription = label,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                )
            } else {
                Box(contentAlignment = Alignment.Center) {
                    if (processing) CircularProgressIndicator(color = ColectaColors.Primary)
                    else Icon(
                        Icons.Outlined.CameraAlt,
                        contentDescription = null,
                        tint = ColectaColors.OnBgSubtle,
                        modifier = Modifier.size(36.dp),
                    )
                }
            }
        }
    }

    if (sheetOpen) {
        ModalBottomSheet(
            onDismissRequest = { sheetOpen = false },
            containerColor = ColectaColors.Surface,
        ) {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                Text(label, style = MaterialTheme.typography.titleMedium, color = ColectaColors.OnBg)
                Spacer(Modifier.height(12.dp))
                ListItem(
                    headlineContent = { Text("Tomar foto") },
                    leadingContent = { Icon(Icons.Outlined.CameraAlt, null, tint = ColectaColors.Primary) },
                    modifier = Modifier.clickable {
                        sheetOpen = false
                        openCamera()
                    },
                    colors = ListItemDefaults.colors(containerColor = ColectaColors.Surface),
                )
                ListItem(
                    headlineContent = { Text("Elegir de galería") },
                    leadingContent = { Icon(Icons.Outlined.PhotoLibrary, null, tint = ColectaColors.Primary) },
                    modifier = Modifier.clickable {
                        sheetOpen = false
                        galleryLauncher.launch(
                            androidx.activity.result.PickVisualMediaRequest(
                                ActivityResultContracts.PickVisualMedia.ImageOnly,
                            ),
                        )
                    },
                    colors = ListItemDefaults.colors(containerColor = ColectaColors.Surface),
                )
                if (uri != null) {
                    ListItem(
                        headlineContent = { Text("Quitar foto", color = ColectaColors.Err) },
                        modifier = Modifier.clickable {
                            sheetOpen = false
                            onChange(null)
                        },
                        colors = ListItemDefaults.colors(containerColor = ColectaColors.Surface),
                    )
                }
                Spacer(Modifier.height(12.dp))
            }
        }
    }
}

private fun newCameraOutputUri(context: Context): Uri {
    val dir = File(context.cacheDir, "photos").apply { mkdirs() }
    val file = File(dir, "cam_${System.currentTimeMillis()}.jpg")
    val authority = "${context.packageName}.fileprovider"
    return FileProvider.getUriForFile(context, authority, file)
}

