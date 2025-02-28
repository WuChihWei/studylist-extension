import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="privacy-policy-container">
      <div className="privacy-policy-header">
        <button className="back-button" onClick={onBack}>
          <FiArrowLeft /> Back
        </button>
        <h2>Privacy Policy</h2>
      </div>
      <div className="privacy-policy-content">
        <h3>StudyList Extension 隱私權政策 / Privacy Policy</h3>
        <p>更新日期 / Last Updated: 2024-03-14</p>

        <h4>1. 我們收集哪些數據？ / What Data Do We Collect?</h4>
        <p>StudyList Extension 可能會收集以下類型的數據：</p>
        <p>StudyList Extension may collect the following types of data:</p>
        <ul>
          <li>
            用戶筆記與標註：當用戶主動使用擴展來擷取學習資料時，擴展可能會存儲筆記、標註或書籤內容。<br />
            User notes and highlights: When users actively use the extension to capture study materials, the extension may store notes, highlights, or bookmarks.
          </li>
          <li>
            本機存儲數據：我們可能會存儲用戶的設定，例如擴展的使用偏好（例如深色模式、快捷鍵等）。<br />
            Local storage data: We may store user preferences such as extension settings (e.g., dark mode, keyboard shortcuts, etc.).
          </li>
          <li>
            網站訪問權限：擴展可能需要存取當前網頁內容，以便用戶擷取筆記，但不會追蹤或記錄用戶的瀏覽歷史。<br />
            Website access permission: The extension may need to access the current webpage content to allow users to capture notes, but it does not track or log browsing history.
          </li>
        </ul>

        <h4>2. 數據存儲位置？ / Where Is The Data Stored?</h4>
        <ul>
          <li>
            本機存儲：用戶的筆記與標註預設存儲在本地瀏覽器，不會自動發送到任何遠端伺服器。<br />
            Local storage: User notes and highlights are stored locally in the browser by default and are not automatically sent to any remote server.
          </li>
          <li>
            雲端同步（如果用戶登入 StudyList 帳戶）：如果用戶選擇登入 StudyList 帳戶，擴展將同步筆記到 StudyList 伺服器，以便在不同設備之間存取。<br />
            Cloud sync (if logged in): If users choose to log into their StudyList account, the extension will sync notes to StudyList servers for cross-device access.
          </li>
        </ul>

        <h4>3. 我們是否與第三方共享數據？ / Do We Share Data With Third Parties?</h4>
        <p>
          🚫 不，我們不會出售、共享或出租您的個人數據給任何第三方。<br />
          🚫 No, we do not sell, share, or rent your personal data to any third parties.
        </p>
        <p>
          🔐 唯一的例外：如果用戶選擇啟用 StudyList 雲端同步，筆記將加密存儲在 StudyList 伺服器。<br />
          🔐 The only exception: If users enable StudyList cloud sync, notes will be stored securely on StudyList servers.
        </p>

        <h4>4. 資料保留與刪除 / Data Retention and Deletion</h4>
        <ul>
          <li>
            資料保留期限：用戶資料將保留至帳號刪除為止。<br />
            Data retention period: User data will be retained until account deletion.
          </li>
          <li>
            資料刪除方式：用戶可以通過網站設定頁面刪除帳號及所有相關資料。<br />
            Data deletion: Users can delete their account and all associated data through the website settings page.
          </li>
        </ul>

        <h4>5. 資料安全 / Data Security</h4>
        <ul>
          <li>
            加密方式：所有同步到雲端的資料都使用 AES-256 加密。<br />
            Encryption: All data synced to the cloud is encrypted using AES-256.
          </li>
          <li>
            存取控制：只有您本人可以存取您的資料。<br />
            Access control: Only you can access your data.
          </li>
        </ul>

        <h4>6. 用戶控制與選擇 / User Control & Choices</h4>
        <ul>
          <li>
            🔹 刪除數據：您可以隨時刪除您的筆記，或者清除瀏覽器存儲來移除所有擴展數據。<br />
            🔹 Delete Data: You can delete your notes anytime or clear your browser storage.
          </li>
          <li>
            🔹 關閉雲端同步：如果您不希望數據存儲在雲端，請勿登入 StudyList 帳戶。<br />
            🔹 Disable Cloud Sync: If you do not want cloud storage, do not log into your account.
          </li>
        </ul>

        <h4>7. 聯絡我們 / Contact Us</h4>
        <p>
          如果您對此隱私權政策有任何問題，請透過以下方式與我們聯繫：<br />
          If you have any questions about this privacy policy, please contact us via:
        </p>
        <p>📧 Email: jordanwu1993@gmail.com</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;