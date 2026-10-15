
const API = {
    students: "/api/students",
    attendance: "/api/attendance",
    markAttendance: "/api/attendance/mark"
};

const $ = (id) => document.getElementById(id);

let students = [];

function showMessage(elementId, message, type = "") {
    const element = $(elementId);
    element.textContent = message;
    element.className = `message ${type}`;
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });

    const text = await response.text();

    if (!response.ok) {
        throw new Error(text || `Request failed: ${response.status}`);
    }

    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function getList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
}

function studentIdOf(student) {
    return student.id ?? student.studentId;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function displayDate(value) {
    if (!value) return "-";

    if (Array.isArray(value)) {
        const [year, month, day] = value;
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    return String(value).slice(0, 10);
}

async function loadStudents() {
    showMessage("studentMessage", "");

    try {
        const data = await apiRequest(API.students);
        students = getList(data);

        $("totalStudents").textContent = students.length;

        const tbody = $("studentsTable");

        if (students.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="4">No students found. Add a student above.</td></tr>';
        } else {
            tbody.innerHTML = students.map((student) => `
                <tr>
                    <td>${escapeHTML(studentIdOf(student))}</td>
                    <td>${escapeHTML(student.name)}</td>
                    <td>${escapeHTML(student.email)}</td>
                    <td>${escapeHTML(student.department)}</td>
                </tr>
            `).join("");
        }

        updateStudentOptions();
    } catch (error) {
        showMessage(
            "studentMessage",
            `Unable to load students: ${error.message}`,
            "error"
        );

        $("studentsTable").innerHTML =
            '<tr><td colspan="4">Could not load students.</td></tr>';
    }
}

function updateStudentOptions() {
    const selects = [
        $("attendanceStudent"),
        $("percentageStudent")
    ];

    for (const select of selects) {
        const previousValue = select.value;

        select.innerHTML =
            '<option value="">Select a student</option>';

        for (const student of students) {
            const id = studentIdOf(student);
            if (id == null) continue;

            const option = document.createElement("option");
            option.value = id;
            option.textContent = `${student.name} (ID: ${id})`;
            select.appendChild(option);
        }

        if ([...select.options].some(option => option.value === previousValue)) {
            select.value = previousValue;
        }
    }
}

async function loadAttendance() {
    showMessage("recordsMessage", "");

    try {
        const data = await apiRequest(API.attendance);
        const records = getList(data);

        $("totalRecords").textContent = records.length;

        const tbody = $("attendanceTable");

        if (records.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="3">No attendance records found.</td></tr>';
            return;
        }

        tbody.innerHTML = records.map((record) => {
            const studentId =
                record.studentId ??
                record.student?.id ??
                record.student?.studentId ??
                "-";

            const date =
                record.attendanceDate ??
                record.date ??
                record.createdAt;

            return `
                <tr>
                    <td>${escapeHTML(studentId)}</td>
                    <td>${escapeHTML(record.status)}</td>
                    <td>${escapeHTML(displayDate(date))}</td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        showMessage(
            "recordsMessage",
            `Unable to load attendance: ${error.message}`,
            "error"
        );

        $("attendanceTable").innerHTML =
            '<tr><td colspan="3">Could not load attendance records.</td></tr>';
    }
}

$("studentForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = $("addStudentBtn");
    button.disabled = true;

    const student = {
        name: $("studentName").value.trim(),
        email: $("studentEmail").value.trim(),
        department: $("studentDepartment").value.trim()
    };

    try {
        await apiRequest(API.students, {
            method: "POST",
            body: JSON.stringify(student)
        });

        showMessage(
            "studentMessage",
            "Student added successfully!",
            "success"
        );

        $("studentForm").reset();
        await loadStudents();
    } catch (error) {
        showMessage(
            "studentMessage",
            `Unable to add student: ${error.message}`,
            "error"
        );
    } finally {
        button.disabled = false;
    }
});

$("attendanceForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = $("markAttendanceBtn");
    button.disabled = true;

    const studentId = $("attendanceStudent").value;

    const attendance = {
        studentId: Number(studentId),
        status: $("attendanceStatus").value,
        attendanceDate: $("attendanceDate").value
    };

    try {
        await apiRequest(API.markAttendance, {
            method: "POST",
            body: JSON.stringify(attendance)
        });

        showMessage(
            "attendanceMessage",
            "Attendance marked successfully!",
            "success"
        );

        await loadAttendance();
    } catch (error) {
        showMessage(
            "attendanceMessage",
            `Unable to mark attendance: ${error.message}`,
            "error"
        );
    } finally {
        button.disabled = false;
    }
});

$("percentageForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const studentId = $("percentageStudent").value;
    const result = $("percentageResult");

    result.textContent = "Loading percentage...";

    try {
        const data = await apiRequest(
            `/api/attendance/percentage/${encodeURIComponent(studentId)}`
        );

        let percentage;

        if (typeof data === "number") {
            percentage = data;
        } else if (typeof data === "string" && data.trim() !== "") {
            percentage = Number(data);
        } else {
            percentage = data?.attendancePercentage ??
                data?.percentage ??
                data?.data;
        }

        if (percentage == null || !Number.isFinite(Number(percentage))) {
            result.textContent =
                "API response format is different. Check the response in Swagger.";
            return;
        }

        result.textContent =
            `Attendance Percentage: ${Number(percentage).toFixed(2)}%`;
    } catch (error) {
        result.textContent =
            `Unable to get percentage: ${error.message}`;
    }
});

$("refreshStudents").addEventListener("click", loadStudents);
$("refreshAttendance").addEventListener("click", loadAttendance);

// Set today's date automatically.
const today = new Date();
const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().slice(0, 10);

$("attendanceDate").value = localDate;

// Load saved data when the page opens.
loadStudents();
loadAttendance();
