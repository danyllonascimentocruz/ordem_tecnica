<?php
header('Content-Type: application/json');
$data = json_decode(file_get_contents("php://input"), true);

$usuario = $data['usuario'];
$nova_senha = $data['nova_senha'];
$secreta = $data['palavra_secreta'];

if ($secreta !== "onlyne@123") {
    echo json_encode(['success' => false, 'message' => 'Palavra secreta inválida']);
    exit;
}

try {
    $pdo = new PDO("firebird:dbname=localhost/3050:C:/firebird_data/DADOS5.FDB;charset=WIN1251", 'SYSDBA', 'masterkey');
    $stmt = $pdo->prepare("UPDATE USUARIOS_LOGIN SET SENHA = :nova WHERE USUARIO = :usuario");
    $stmt->execute([':nova' => $nova_senha, ':usuario' => $usuario]);
    echo json_encode(['success' => true, 'message' => 'Senha alterada com sucesso']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
