package com.colecta.app.util

import java.text.NumberFormat
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Currency
import java.util.Locale

private val ES = Locale("es", "ES")

fun formatCurrency(amount: Double?, currency: String = "EUR"): String {
    if (amount == null) return "—"
    val nf = NumberFormat.getCurrencyInstance(ES)
    runCatching { nf.currency = Currency.getInstance(currency) }
    return nf.format(amount)
}

fun formatDate(iso: String?): String {
    if (iso.isNullOrBlank()) return ""
    return runCatching {
        val instant = Instant.parse(iso)
        DateTimeFormatter.ofPattern("dd/MM/yyyy", ES).withZone(ZoneId.systemDefault()).format(instant)
    }.getOrDefault(iso.take(10))
}

fun nowIso(): String = Instant.now().toString()
