<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

unset($_SESSION['usuario']);
header('Location: login.php');
exit;