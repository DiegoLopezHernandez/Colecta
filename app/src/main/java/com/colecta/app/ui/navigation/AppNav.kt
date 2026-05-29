package com.colecta.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.FolderOpen
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.Paid
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.colecta.app.ui.screens.coins.AddCoinScreen
import com.colecta.app.ui.screens.coins.CoinDetailScreen
import com.colecta.app.ui.screens.coins.CoinsListScreen
import com.colecta.app.ui.screens.coins.EditCoinScreen
import com.colecta.app.ui.screens.collections.CollectionDetailScreen
import com.colecta.app.ui.screens.collections.CollectionsScreen
import com.colecta.app.ui.screens.objects.AddObjectScreen
import com.colecta.app.ui.screens.objects.EditObjectScreen
import com.colecta.app.ui.screens.objects.ObjectDetailScreen
import com.colecta.app.ui.screens.objects.ObjectsListScreen
import com.colecta.app.ui.screens.settings.SettingsScreen
import com.colecta.app.ui.screens.stats.StatsScreen
import com.colecta.app.ui.theme.ColectaColors

/** Rutas tipo-string. Simples para un MVP — sin sealed classes overengineered. */
object Routes {
    const val Coins = "coins"
    const val Objects = "objects"
    const val Collections = "collections"
    const val Stats = "stats"
    const val Settings = "settings"

    const val AddCoin = "add_coin"
    const val CoinDetail = "coin/{id}"
    const val CoinEdit = "coin_edit/{id}"
    const val AddObject = "add_object"
    const val ObjectDetail = "object/{id}"
    const val ObjectEdit = "object_edit/{id}"
    const val CollectionDetail = "collection/{id}"

    fun coinDetail(id: String) = "coin/$id"
    fun coinEdit(id: String) = "coin_edit/$id"
    fun objectDetail(id: String) = "object/$id"
    fun objectEdit(id: String) = "object_edit/$id"
    fun collectionDetail(id: String) = "collection/$id"
}

private data class Tab(val route: String, val label: String, val icon: ImageVector)

private val tabs = listOf(
    Tab(Routes.Coins, "Monedas", Icons.Outlined.Paid),
    Tab(Routes.Objects, "Objetos", Icons.Outlined.Inventory2),
    Tab(Routes.Collections, "Álbumes", Icons.Outlined.FolderOpen),
    Tab(Routes.Stats, "Estad.", Icons.Outlined.BarChart),
    Tab(Routes.Settings, "Ajustes", Icons.Outlined.Settings),
)

@Composable
fun AppNav() {
    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route

    val showBottomBar = currentRoute in tabs.map { it.route }

    Scaffold(
        containerColor = ColectaColors.Bg,
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(containerColor = ColectaColors.Surface, tonalElevation = 0.dp) {
                    tabs.forEach { tab ->
                        val selected = backStack?.destination?.hierarchy?.any { it.route == tab.route } == true
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                nav.navigate(tab.route) {
                                    popUpTo(nav.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = ColectaColors.Primary,
                                selectedTextColor = ColectaColors.Primary,
                                unselectedIconColor = ColectaColors.OnBgMuted,
                                unselectedTextColor = ColectaColors.OnBgMuted,
                                indicatorColor = ColectaColors.Surface3,
                            ),
                        )
                    }
                }
            }
        },
    ) { inner ->
        NavHost(
            navController = nav,
            startDestination = Routes.Coins,
            modifier = Modifier.padding(inner),
        ) {
            composable(Routes.Coins) {
                CoinsListScreen(
                    onAdd = { nav.navigate(Routes.AddCoin) },
                    onOpen = { id -> nav.navigate(Routes.coinDetail(id)) },
                )
            }
            composable(Routes.Objects) {
                ObjectsListScreen(
                    onAdd = { nav.navigate(Routes.AddObject) },
                    onOpen = { id -> nav.navigate(Routes.objectDetail(id)) },
                )
            }
            composable(Routes.Collections) {
                CollectionsScreen(onOpen = { id -> nav.navigate(Routes.collectionDetail(id)) })
            }
            composable(Routes.Stats) { StatsScreen() }
            composable(Routes.Settings) { SettingsScreen() }

            composable(
                Routes.CollectionDetail,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) {
                CollectionDetailScreen(
                    onBack = { nav.popBackStack() },
                    onOpenCoin = { id -> nav.navigate(Routes.coinDetail(id)) },
                )
            }

            composable(Routes.AddCoin) {
                AddCoinScreen(onBack = { nav.popBackStack() })
            }
            composable(
                Routes.CoinDetail,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) {
                CoinDetailScreen(
                    onBack = { nav.popBackStack() },
                    onEdit = { id -> nav.navigate(Routes.coinEdit(id)) },
                )
            }
            composable(
                Routes.CoinEdit,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) {
                EditCoinScreen(onBack = { nav.popBackStack() })
            }
            composable(Routes.AddObject) {
                AddObjectScreen(onBack = { nav.popBackStack() })
            }
            composable(
                Routes.ObjectDetail,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) {
                ObjectDetailScreen(
                    onBack = { nav.popBackStack() },
                    onEdit = { id -> nav.navigate(Routes.objectEdit(id)) },
                )
            }
            composable(
                Routes.ObjectEdit,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) {
                EditObjectScreen(onBack = { nav.popBackStack() })
            }
        }
    }
}
