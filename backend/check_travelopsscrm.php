<?php
$conn = mysqli_connect('127.0.0.1', 'root', '');
$db = 'travelopsscrm';
mysqli_select_db($conn, $db);
$res = mysqli_query($conn, "SHOW TABLES LIKE 'leads'");
if (mysqli_num_rows($res) > 0) {
    echo "Database: $db HAS leads table.\n";
    $c = mysqli_fetch_array(mysqli_query($conn, "SELECT COUNT(*) FROM leads"));
    echo "  - COUNT: " . $c[0] . "\n";
    $q = mysqli_query($conn, "SELECT id, query_id FROM leads WHERE query_id LIKE '%0055%' OR id = 55");
    while ($row = mysqli_fetch_array($q)) {
        echo "  - MATCH: ID: {$row['id']}, QID: {$row['query_id']}\n";
    }
} else {
    echo "Database: $db DOES NOT HAVE leads table.\n";
}
