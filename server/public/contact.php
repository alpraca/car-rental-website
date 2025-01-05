<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php'; // Ensure you have PHPMailer installed via Composer

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $message = htmlspecialchars($_POST['message']);

    // Create a new PHPMailer instance
    $mail = new PHPMailer(true);

    try {
        //Server settings
        $mail->isSMTP();                                            // Set mailer to use SMTP
        $mail->Host = 'smtp.gmail.com';                              // Set the SMTP server to Gmail
        $mail->SMTPAuth = true;                                       // Enable SMTP authentication
        $mail->Username = 'itarumberti183@gmail.com';                     // Your Gmail address
        $mail->Password = 'ulem gcgl zwhw kgkq';              // Your Gmail App password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;           // Enable TLS encryption
        $mail->Port = 587;                                           // TCP port to connect to

        //Recipients
        $mail->setFrom('your_email@gmail.com', 'Your Name');          // Sender's email and name
        $mail->addAddress('caralbaniarent@gmail.com', 'Rent CarAlbania'); // Receiver's email (where you want to receive the messages)
        
        //Content
        $mail->isHTML(true);                                          // Set email format to HTML
        $mail->Subject = 'New Contact Form Message';                  // Subject of the email
        $mail->Body    = "Name: $name<br>Email: $email<br>Message: $message";  // Message body

        // Send email
        if ($mail->send()) {
            echo "<script>alert('Message sent successfully!'); window.location = 'contacts.html';</script>";
        } else {
            echo "<script>alert('Message failed to send.'); window.location = 'contacts.html';</script>";
        }
    } catch (Exception $e) {
        echo "<script>alert('Message could not be sent. Mailer Error: {$mail->ErrorInfo}'); window.location = 'contacts.html';</script>";
    }
}
?>
