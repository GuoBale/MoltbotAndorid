package com.moltbot.bridge

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.PermissionStatus
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.moltbot.bridge.service.BridgeService
import com.moltbot.bridge.ui.theme.MoltbotBridgeTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MoltbotBridgeTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    BridgeMainScreen()
                }
            }
        }
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun BridgeMainScreen() {
    val context = LocalContext.current
    var isServiceRunning by remember { mutableStateOf(false) }

    // 定义需要的权限
    val permissions = buildList {
        // 通知权限 (Android 13+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            add(Manifest.permission.POST_NOTIFICATIONS)
        }
        // 联系人
        add(Manifest.permission.READ_CONTACTS)
        // 通话记录
        add(Manifest.permission.READ_CALL_LOG)
        // 拨打电话（用于 android_dial 直接拨出）
        add(Manifest.permission.CALL_PHONE)
        // 短信
        add(Manifest.permission.READ_SMS)
        add(Manifest.permission.SEND_SMS)
        // 日历
        add(Manifest.permission.READ_CALENDAR)
        add(Manifest.permission.WRITE_CALENDAR)
        // 媒体
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            add(Manifest.permission.READ_MEDIA_IMAGES)
            add(Manifest.permission.READ_MEDIA_AUDIO)
            add(Manifest.permission.READ_MEDIA_VIDEO)
        }
        // 录音
        add(Manifest.permission.RECORD_AUDIO)
        // 位置
        add(Manifest.permission.ACCESS_FINE_LOCATION)
    }

    val permissionsState = rememberMultiplePermissionsState(permissions)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Moltbot Bridge",
            style = MaterialTheme.typography.headlineLarge,
            modifier = Modifier.padding(vertical = 24.dp)
        )

        // 服务状态卡片
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "服务状态",
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (isServiceRunning) "● 运行中" else "○ 已停止",
                        color = if (isServiceRunning) 
                            MaterialTheme.colorScheme.primary 
                        else 
                            MaterialTheme.colorScheme.outline
                    )
                    Spacer(modifier = Modifier.weight(1f))
                    Text(
                        text = "端口: 18800",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.outline
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 启动/停止按钮
        Button(
            onClick = {
                if (isServiceRunning) {
                    context.stopService(Intent(context, BridgeService::class.java))
                    isServiceRunning = false
                } else {
                    val intent = Intent(context, BridgeService::class.java)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(intent)
                    } else {
                        context.startService(intent)
                    }
                    isServiceRunning = true
                }
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (isServiceRunning) "停止服务" else "启动服务")
        }

        Spacer(modifier = Modifier.height(24.dp))

        // 权限卡片
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "权限状态",
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(8.dp))

                val grantedCount = permissionsState.permissions.count { it.status == PermissionStatus.Granted }
                val totalCount = permissionsState.permissions.size

                Text(
                    text = "已授权 $grantedCount / $totalCount",
                    style = MaterialTheme.typography.bodyMedium
                )

                Spacer(modifier = Modifier.height(8.dp))

                // 显示各权限状态
                permissionsState.permissions.forEach { perm ->
                    val permName = perm.permission.substringAfterLast(".")
                    val isGranted = perm.status == PermissionStatus.Granted
                    Text(
                        text = "${if (isGranted) "✓" else "✗"} $permName",
                        style = MaterialTheme.typography.bodySmall,
                        color = if (isGranted) 
                            MaterialTheme.colorScheme.primary 
                        else 
                            MaterialTheme.colorScheme.error
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = { permissionsState.launchMultiplePermissionRequest() },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("请求权限")
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // 使用说明
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "使用说明",
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = """
                        1. 授予所需权限
                        2. 点击"启动服务"
                        3. 在 Termux 中运行 Gateway
                        4. Gateway 将通过 localhost:18800 调用 Android API
                    """.trimIndent(),
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}
