package com.colecta.app.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

/**
 * Procesa y guarda una imagen capturada en almacenamiento persistente.
 *
 * - Redimensiona al lado mayor `MAX_DIM` para no guardar varios MB inútiles.
 * - Comprime como JPEG calidad 80.
 * - Guarda en `filesDir/photos/<uuid>.jpg`.
 *
 * Devuelve un `file://` URI estable que sobrevive a reinicios/limpiezas de caché.
 *
 * CameraX ya escribe los frames respetando la orientación del sensor cuando se
 * usa `ImageCapture.takePicture(OutputFileOptions)`, por eso aquí no aplicamos
 * rotación EXIF manualmente.
 */
object ImageUtil {
    private const val MAX_DIM = 1600
    private const val QUALITY = 80

    fun persistFromUri(context: Context, source: Uri): String? = runCatching {
        val dir = File(context.filesDir, "photos").apply { mkdirs() }
        val out = File(dir, "${UUID.randomUUID()}.jpg")
        val bitmap = decodeAndResize(context, source) ?: return null
        FileOutputStream(out).use { fos ->
            bitmap.compress(Bitmap.CompressFormat.JPEG, QUALITY, fos)
        }
        bitmap.recycle()
        Uri.fromFile(out).toString()
    }.getOrNull()

    fun deleteIfPersisted(context: Context, uriString: String?) {
        if (uriString.isNullOrBlank()) return
        runCatching {
            val photosPath = File(context.filesDir, "photos").absolutePath
            val path = Uri.parse(uriString).path ?: return
            val f = File(path)
            if (f.absolutePath.startsWith(photosPath) && f.exists()) f.delete()
        }
    }

    private fun decodeAndResize(context: Context, source: Uri): Bitmap? {
        val cr = context.contentResolver
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        cr.openInputStream(source).use { BitmapFactory.decodeStream(it, null, bounds) }
        val w = bounds.outWidth
        val h = bounds.outHeight
        if (w <= 0 || h <= 0) return null

        val sample = run {
            var s = 1
            while (maxOf(w / s, h / s) > MAX_DIM) s *= 2
            s
        }
        val opts = BitmapFactory.Options().apply { inSampleSize = sample }
        return cr.openInputStream(source).use { BitmapFactory.decodeStream(it, null, opts) }
    }
}
