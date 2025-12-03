import React from 'react'
import { AppLayout } from '../layouts/AppLayout.jsx'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/atoms/Button.jsx'

export const PrivacyPolicy = () => {
  const navigate = useNavigate()
  const [activeLang, setActiveLang] = React.useState('en')

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <AppLayout showFooter={false}>
      {/* Main container styled to match original dimensions/positions */}
      <div className="min-h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="w-full max-w-5xl bg-white rounded-lg border-2 border-[#f0f0f0] shadow-md p-8">
          {/* Title */}
          <h1 className="font-medium text-gray-900 text-xl text-center leading-normal underline mb-6">
            Privacy Policy
          </h1>

          {/* Content */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setActiveLang('en')}
                className={[
                  'px-3 py-1 text-sm rounded-md',
                  activeLang === 'en' ? 'bg-white text-gray-900 font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-800'
                ].join(' ')}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setActiveLang('id')}
                className={[
                  'ml-1 px-3 py-1 text-sm rounded-md',
                  activeLang === 'id' ? 'bg-white text-gray-900 font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-800'
                ].join(' ')}
              >
                Bahasa Indonesia
              </button>
            </div>
          </div>

          <div className="max-h-[576px] overflow-y-auto font-normal text-gray-600 text-base leading-normal space-y-4">
            {activeLang === 'en' ? (
              <div className="space-y-4">
                <p><strong>1. About Nova English.</strong> Nova English ("we", "our", "us") is an online platform that helps students practise English tests, track their progress, and receive feedback. Tutors use the platform to create and manage questions, test packages, and student progress reports. This Privacy Policy explains how we collect, use, and protect your personal data when you use the Nova English website and services.</p>
                <p><strong>2. Information we collect.</strong> We collect the information you provide directly to us, including account details such as full name, email address, phone number, place and date of birth, gender, and password; your role and profile information (for example, student or tutor); test activity and results; communication data when you contact us; and basic technical information sent by your browser (such as IP address, device information, and log data) to help keep the service secure and reliable.</p>
                <p><strong>3. How we use your information.</strong> We use your information to provide, operate, and maintain the Nova English platform; support learning, feedback, and progress tracking; improve the stability, performance, and security of our services; and communicate with you (for example, to send verification emails, password reset links, and important service notices). We do not sell your personal data.</p>
                <p><strong>4. How we share information.</strong> We may share your information with trusted service providers who help us operate Nova English (such as hosting, email, or analytics providers) under appropriate confidentiality and security obligations; with authorised tutors and administrators so they can review student performance and manage classes or test packages; and when required by law or when we believe it is necessary to protect the rights, property, or safety of Nova English, our users, or others.</p>
                <p><strong>5. Data retention and deletion.</strong> We keep your account and test history for as long as your account is active and as needed to provide our services. You can update your profile in the Account Settings page, and students can request account deletion from that page. When an account is deleted, we delete or anonymise personal data where reasonably possible, while keeping any data we are required to retain for legitimate business, security, or legal reasons.</p>
                <p><strong>6. Your choices and rights.</strong> You may view and update your profile details in Account Settings, change your password through the password reset flow, request account deletion (for students), and contact us if you have questions about your data or need help correcting inaccurate information.</p>
                <p><strong>7. Children and young learners.</strong> Nova English is designed mainly for school-age learners. The platform currently requires a minimum age of five years based on date of birth. If you are under 18, you should use Nova English with the knowledge and permission of a parent, guardian, or your school.</p>
                <p><strong>8. Changes to this Privacy Policy.</strong> We may update this Privacy Policy from time to time to reflect changes in our services or in applicable laws. When we make important changes, we will update this page and, where appropriate, notify you through the website or by email. Your continued use of Nova English after changes take effect means you accept the updated policy.</p>
                <p><strong>9. Contact us.</strong> If you have any questions about this Privacy Policy or how we handle your data, you can contact us using the email or WhatsApp details shown in the footer of our website.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p><strong>1. Tentang Nova English.</strong> Nova English ("kami") adalah platform online yang membantu siswa berlatih tes bahasa Inggris, memantau perkembangan, dan menerima umpan balik. Tutor menggunakan platform ini untuk membuat dan mengelola soal, paket tes, serta laporan perkembangan siswa. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda ketika menggunakan website dan layanan Nova English.</p>
                <p><strong>2. Data yang kami kumpulkan.</strong> Kami mengumpulkan data yang Anda berikan secara langsung kepada kami, termasuk data akun seperti nama lengkap, alamat email, nomor telepon, tempat dan tanggal lahir, jenis kelamin, dan kata sandi; peran dan informasi profil Anda (misalnya sebagai siswa atau tutor); aktivitas tes dan hasil; data komunikasi saat Anda menghubungi kami; serta informasi teknis dasar yang dikirimkan oleh browser Anda (seperti alamat IP, informasi perangkat, dan data log) untuk membantu menjaga keamanan dan keandalan layanan.</p>
                <p><strong>3. Cara kami menggunakan data Anda.</strong> Kami menggunakan data Anda untuk menyediakan, mengoperasikan, dan memelihara platform Nova English; mendukung proses belajar, pemberian umpan balik, dan pemantauan perkembangan; meningkatkan stabilitas, kinerja, dan keamanan layanan kami; serta berkomunikasi dengan Anda (misalnya untuk mengirim email verifikasi, tautan reset kata sandi, dan pemberitahuan penting terkait layanan). Kami tidak menjual data pribadi Anda.</p>
                <p><strong>4. Berbagi data dengan pihak lain.</strong> Kami dapat membagikan data Anda kepada penyedia layanan tepercaya yang membantu mengoperasikan Nova English (misalnya untuk hosting, email, atau analitik) dengan kewajiban kerahasiaan dan keamanan yang sesuai; kepada tutor dan administrator yang berwenang untuk meninjau performa siswa dan mengelola kelas atau paket tes; serta ketika diwajibkan oleh hukum atau ketika kami meyakini bahwa tindakan tersebut diperlukan untuk melindungi hak, properti, atau keselamatan Nova English, pengguna kami, atau pihak lain.</p>
                <p><strong>5. Penyimpanan dan penghapusan data.</strong> Kami menyimpan akun dan riwayat tes Anda selama akun masih aktif dan selama diperlukan untuk menyediakan layanan kami. Anda dapat memperbarui profil melalui halaman Account Settings, dan siswa dapat meminta penghapusan akun dari halaman tersebut. Ketika akun dihapus, kami akan menghapus atau menganonimkan data pribadi sejauh yang wajar, sambil tetap menyimpan data yang perlu dipertahankan untuk alasan operasional, keamanan, atau hukum.</p>
                <p><strong>6. Pilihan dan hak Anda.</strong> Anda dapat melihat dan memperbarui informasi profil di Account Settings, mengubah kata sandi melalui alur reset kata sandi, meminta penghapusan akun (untuk siswa) melalui opsi yang tersedia di Account Settings, serta menghubungi kami jika memiliki pertanyaan tentang data Anda atau membutuhkan bantuan untuk memperbaiki informasi yang tidak akurat.</p>
                <p><strong>7. Anak dan pelajar muda.</strong> Nova English terutama ditujukan bagi pelajar usia sekolah. Saat ini, platform menerapkan batas usia minimum lima tahun berdasarkan tanggal lahir. Jika Anda berusia di bawah 18 tahun, sebaiknya menggunakan Nova English dengan sepengetahuan dan izin orang tua, wali, atau pihak sekolah.</p>
                <p><strong>8. Perubahan terhadap Kebijakan Privasi.</strong> Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu untuk menyesuaikan dengan perubahan layanan atau peraturan yang berlaku. Jika ada perubahan penting, kami akan memperbarui halaman ini dan, bila perlu, memberi tahu Anda melalui website atau email. Penggunaan Nova English yang berkelanjutan setelah perubahan berlaku berarti Anda menyetujui Kebijakan Privasi yang telah diperbarui.</p>
                <p><strong>9. Menghubungi kami.</strong> Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini atau cara kami mengelola data pribadi Anda, silakan hubungi kami melalui email atau WhatsApp yang tercantum di footer website kami.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end mt-10">
            <Button
              variant="primary"
              className="w-40 sm:w-56 h-10 sm:h-12 text-sm sm:text-base"
              onClick={handleBack}
              aria-label="Agree to Privacy Policy"
            >
              I AGREE
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
