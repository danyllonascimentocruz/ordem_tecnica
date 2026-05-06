<?php
header('Content-Type: application/json');
$data = json_decode(file_get_contents("php://input"), true);

$usuario = $data['usuario'];
$senha = $data['senha'];

try {
    $pdo = new PDO("firebird:dbname=localhost/3050:C:/firebird_data/DADOS5.FDB;charset=WIN1251", 'SYSDBA', 'masterkey');
    $stmt = $pdo->prepare("SELECT 1 FROM USUARIOS_LOGIN WHERE USUARIO = :usuario AND SENHA = :senha");
    $stmt->execute([':usuario' => $usuario, ':senha' => $senha]);
    echo json_encode(['success' => $stmt->fetch() ? true : false]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
