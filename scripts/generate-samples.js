const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Sample Agents
const agentsData = [
    {
        "Mã số": "AG001",
        "Họ tên": "Nguyễn Văn A",
        "Cấp bậc": "FA",
        "Ngày gia nhập": "2023-01-15",
        "Trạng thái": "Active",
        "Mã quản lý": "MAN001",
        "Tên quản lý": "Trần Thị B",
        "Mã tuyển dụng": "REC001",
        "Người tuyển dụng": "Lê Văn E",
        "Điện thoại": "0901234567",
        "Email": "a.nguyen@example.com",
        "CMND": "123456789",
        "Ngày sinh": "1990-01-01",
        "Địa chỉ": "123 Lê Lợi, Hà Nội",
        "Số tài khoản": "100200300",
        "Ngân hàng": "VCB",
        "Mã số thuế": "800900100",
        "Văn phòng": "Hanoi"
    },
    {
        "Mã số": "AG002",
        "Họ tên": "Lê Thị C",
        "Cấp bậc": "SA",
        "Ngày gia nhập": "2023-10-20",
        "Trạng thái": "", // Auto-derived to Pending
        "Mã quản lý": "MAN002",
        "Tên quản lý": "Phạm Văn D",
        "Mã tuyển dụng": "REC002",
        "Người tuyển dụng": "",
        "Điện thoại": "0909876543",
        "Email": "c.le@example.com",
        "CMND": "987654321",
        "Ngày sinh": "1995-05-05",
        "Địa chỉ": "456 Nguyễn Huệ, HCM",
        "Số tài khoản": "200300400",
        "Ngân hàng": "ACB",
        "Mã số thuế": "700600500",
        "Văn phòng": "HCM"
    },
    {
        "Mã số": "AG003",
        "Họ tên": "Hoàng Văn F",
        "Cấp bậc": "Ter",
        "Ngày gia nhập": "2020-01-01",
        "Trạng thái": "", // Auto-derived to Terminated
        "Mã quản lý": "MAN001",
        "Tên quản lý": "Trần Thị B",
        "Mã tuyển dụng": "",
        "Người tuyển dụng": "",
        "Điện thoại": "0912345678",
        "Email": "",
        "CMND": "111222333",
        "Ngày sinh": "1988-08-08",
        "Địa chỉ": "789 Trần Hưng Đạo",
        "Số tài khoản": "",
        "Ngân hàng": "",
        "Mã số thuế": "",
        "Văn phòng": "Danang"
    }
];

const wsAgents = XLSX.utils.json_to_sheet(agentsData);
const wbAgents = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbAgents, wsAgents, "Agents");
XLSX.writeFile(wbAgents, path.join(publicDir, 'sample_agents.xlsx'));
console.log('Generated public/sample_agents.xlsx');

// 2. Sample Contracts
const contractsData = [
    {
        "Số HĐ": "POL12345678",
        "Mã ĐL": "AG001",
        "Tên khách hàng": "Trần Văn Khách",
        "Ngày nộp": "2023-11-10",
        "Ngày cấp": "2023-11-12",
        "Phí Bảo hiểm": 15000000,
        "APE": 15000000,
        "Trạng thái": "Issued"
    },
    {
        "Số HĐ": "POL87654321",
        "Mã ĐL": "AG002",
        "Tên khách hàng": "Nguyễn Thị Hàng",
        "Ngày nộp": "2023-11-15",
        "Ngày cấp": "",
        "Phí Bảo hiểm": 20000000,
        "APE": 20000000,
        "Trạng thái": "Pending"
    }
];

const wsContracts = XLSX.utils.json_to_sheet(contractsData);
const wbContracts = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbContracts, wsContracts, "Contracts");
XLSX.writeFile(wbContracts, path.join(publicDir, 'sample_contracts.xlsx'));
console.log('Generated public/sample_contracts.xlsx');
