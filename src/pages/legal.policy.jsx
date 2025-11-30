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
                <p><strong>1. About Nova English.</strong> Nova English ("we", "our", "us") is an online platform that helps students practise English tests, track their progress, and receive feedback. Tutors use the platform to create and manage questions, test packages, and student progress reports. This Privacy Policy explains how we handle personal data when you use the Nova English website and services.</p>
                <p><strong>2. Information we collect.</strong> We collect the information you provide directly to us, including account details (such as full name, email address, phone number, place and date of birth, gender, and password), your role and profile information, test activity and results, communication data when you contact us, and basic technical information sent by your browser to keep the service secure and reliable.</p>
                <p><strong>3. How we use your information.</strong> We use your information to provide and maintain the service, support learning and feedback, improve reliability and security, and communicate with you (for example, to send verification emails, password reset links, and important service notices). We do not sell your personal data.</p>
                <p><strong>4. How we share information.</strong> We may share your information with trusted service providers who help us operate Nova English, with authorised tutors and administrators so they can review student performance, and when required by law or to protect the rights, property, or safety of Nova English, our users, or others.</p>
                <p><strong>5. Data retention and deletion.</strong> We keep your account and test history for as long as your account is active and needed to provide the service. You can update your profile in Account Settings, and students can request account deletion from that page. When an account is deleted, we remove or anonymise personal data where reasonably possible, while keeping any data we must retain for legitimate business or legal reasons.</p>
                <p><strong>6. Your choices and rights.</strong> You may view and update your profile details in Account Settings, change your password through the reset flow, request account deletion (for students), and contact us if you have questions or need help correcting your data.</p>
                <p><strong>7. Children and young learners.</strong> Nova English is designed mainly for school-age learners. The platform currently requires a minimum age of five years based on date of birth. If you are under 18, you should use Nova English with the knowledge and permission of a parent, guardian, or school.</p>
                <p><strong>8. Changes to this Privacy Policy.</strong> We may update this Privacy Policy from time to time to reflect changes in our service or applicable laws. When we make significant changes, we update the Privacy Policy page on the website. Your continued use of Nova English after changes take effect means you accept the updated policy.</p>
                <p><strong>9. Contact us.</strong> If you have any questions about this Privacy Policy or how we handle your data, you can contact us using the email or WhatsApp details provided in the website footer.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p><strong>1. Tentang Nova English.</strong> Nova English ("kami") adalah platform online yang membantu siswa berlatih tes bahasa Inggris, memantau perkembangan, dan menerima umpan balik. Tutor menggunakan platform ini untuk membuat dan mengelola soal, paket tes, serta laporan perkembangan siswa. Kebijakan Privasi ini menjelaskan bagaimana kami mengelola data pribadi ketika Anda menggunakan website dan layanan Nova English.</p>
                <p><strong>2. Data yang kami kumpulkan.</strong> Kami mengumpulkan data yang Anda berikan secara langsung, termasuk data akun (nama lengkap, email, nomor telepon, tempat dan tanggal lahir, jenis kelamin, dan kata sandi), peran dan informasi profil, aktivitas tes dan hasil, data komunikasi ketika Anda menghubungi kami, serta informasi teknis dasar dari browser untuk menjaga keamanan dan keandalan layanan.</p>
                <p><strong>3. Cara kami menggunakan data Anda.</strong> Kami menggunakan data Anda untuk menyediakan dan mengelola layanan, mendukung proses belajar dan umpan balik, meningkatkan keandalan dan keamanan, serta berkomunikasi dengan Anda (misalnya untuk mengirim email verifikasi, tautan reset kata sandi, dan pemberitahuan penting). Kami tidak menjual data pribadi Anda.</p>
                <p><strong>4. Berbagi data dengan pihak lain.</strong> Kami dapat membagikan data Anda kepada penyedia layanan tepercaya yang membantu mengoperasikan Nova English, kepada tutor dan administrator yang berwenang untuk meninjau performa siswa, serta ketika diwajibkan oleh hukum atau diperlukan untuk melindungi hak, properti, atau keselamatan Nova English, pengguna, atau pihak lain.</p>
                <p><strong>5. Penyimpanan dan penghapusan data.</strong> Kami menyimpan akun dan riwayat tes Anda selama akun masih aktif dan diperlukan untuk menyediakan layanan. Anda dapat memperbarui profil di Account Settings, dan siswa dapat meminta penghapusan akun dari halaman tersebut. Saat akun dihapus, kami akan menghapus atau menganonimkan data pribadi sejauh yang wajar, sambil tetap menyimpan data yang perlu dipertahankan untuk alasan operasional atau hukum.</p>
                <p><strong>6. Pilihan dan hak Anda.</strong> Anda dapat melihat dan memperbarui detail profil di Account Settings, mengubah kata sandi melalui alur reset, meminta penghapusan akun (untuk siswa), dan menghubungi kami jika memiliki pertanyaan atau membutuhkan bantuan terkait data Anda.</p>
                <p><strong>7. Anak dan pelajar muda.</strong> Nova English terutama ditujukan bagi pelajar usia sekolah. Platform ini saat ini menerapkan batas usia minimum lima tahun berdasarkan tanggal lahir. Jika Anda berusia di bawah 18 tahun, sebaiknya menggunakan Nova English dengan sepengetahuan dan izin orang tua, wali, atau pihak sekolah.</p>
                <p><strong>8. Perubahan terhadap Kebijakan Privasi.</strong> Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu untuk menyesuaikan dengan perubahan layanan atau peraturan yang berlaku. Jika ada perubahan penting, kami akan memperbarui halaman Privacy Policy di website. Penggunaan Nova English yang berkelanjutan setelah perubahan berlaku berarti Anda menyetujui kebijakan yang telah diperbarui.</p>
                <p><strong>9. Menghubungi kami.</strong> Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini atau cara kami mengelola data Anda, silakan hubungi kami melalui email atau WhatsApp yang tercantum di footer website.</p>
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
