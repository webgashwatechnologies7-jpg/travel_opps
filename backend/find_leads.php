<?php
$conn = mysqli_connect('127.0.0.1', 'root', '');
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

$res = mysqli_query($conn, "SHOW DATABASES");
while ($row = mysqli_fetch_array($res)) {
    echo "Database: " . $row[0] . "\n";
    $db = $row[0];
    if (in_array($db, ['information_schema', 'mysql', 'performance_schema', 'phpmyadmin', 'sys'])) continue;
    
    $res2 = mysqli_query($conn, "SHOW TABLES FROM `$db` LIKE 'leads'");
    if (mysqli_num_rows($res2) > 0) {
        echo "  - HAS LEADS TABLE!\n";
        $c = mysqli_fetch_array(mysqli_query($conn, "SELECT COUNT(*) FROM `$db`.leads"));
        echo "  - COUNT: " . $c[0] . "\n";
    }
}
