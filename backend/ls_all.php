<?php
$conn = mysqli_connect('127.0.0.1', 'root', '');
$res = mysqli_query($conn, "SHOW DATABASES");
while ($row = mysqli_fetch_array($res)) {
    $db = $row[0];
    if (in_array($db, ['information_schema', 'mysql', 'performance_schema', 'sys'])) continue;
    echo "DB: $db\n";
    $res2 = mysqli_query($conn, "SHOW TABLES FROM `$db` LIMIT 10");
    while ($r2 = mysqli_fetch_array($res2)) {
        echo "  - Table: " . $r2[0] . "\n";
    }
}
