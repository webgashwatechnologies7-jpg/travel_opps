<?php
$conn = mysqli_connect('127.0.0.1', 'root', '');
$db = 'u568698356_crm_travelops';
mysqli_select_db($conn, $db);
$q = mysqli_query($conn, "SELECT id, query_id, client_name FROM leads");
while ($row = mysqli_fetch_array($q)) {
    echo "ID: {$row['id']}, QID: {$row['query_id']}, Name: {$row['client_name']}\n";
}
