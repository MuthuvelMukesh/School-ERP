window.FULL_CHEN_DATA = {
  "entities": [
    {
      "name": "User",
      "pk": [
        "id"
      ],
      "attrs": [
        "name",
        "email"
      ]
    },
    {
      "name": "AcademicYear",
      "pk": [
        "id"
      ],
      "attrs": [
        "year",
        "startDate"
      ]
    },
    {
      "name": "Class",
      "pk": [
        "id"
      ],
      "attrs": [
        "name",
        "section"
      ]
    },
    {
      "name": "Subject",
      "pk": [
        "id"
      ],
      "attrs": [
        "name",
        "code"
      ]
    },
    {
      "name": "Student",
      "pk": [
        "id"
      ],
      "attrs": [
        "admissionNo",
        "firstName"
      ]
    },
    {
      "name": "Permission",
      "pk": [
        "id"
      ],
      "attrs": [
        "key",
        "name"
      ]
    },
    {
      "name": "RolePermission",
      "pk": [
        "id"
      ],
      "attrs": [
        "role",
        "allowed"
      ]
    },
    {
      "name": "UserPermission",
      "pk": [
        "id"
      ],
      "attrs": [
        "allowed"
      ]
    },
    {
      "name": "RoleHierarchy",
      "pk": [
        "id"
      ],
      "attrs": [
        "parentRole",
        "childRole"
      ]
    },
    {
      "name": "StudentPromotion",
      "pk": [
        "id"
      ],
      "attrs": [
        "status",
        "reason"
      ]
    },
    {
      "name": "StudentTransfer",
      "pk": [
        "id"
      ],
      "attrs": [
        "transferType",
        "toSchoolName"
      ]
    },
    {
      "name": "Parent",
      "pk": [
        "id"
      ],
      "attrs": [
        "firstName",
        "lastName"
      ]
    },
    {
      "name": "Staff",
      "pk": [
        "id"
      ],
      "attrs": [
        "firstName",
        "lastName"
      ]
    },
    {
      "name": "Attendance",
      "pk": [
        "id"
      ],
      "attrs": [
        "date",
        "status"
      ]
    },
    {
      "name": "Leave",
      "pk": [
        "id"
      ],
      "attrs": [
        "startDate",
        "endDate"
      ]
    },
    {
      "name": "FeeStructure",
      "pk": [
        "id"
      ],
      "attrs": [
        "name",
        "amount"
      ]
    },
    {
      "name": "FeePayment",
      "pk": [
        "id"
      ],
      "attrs": [
        "amount",
        "paymentDate"
      ]
    },
    {
      "name": "SalaryPayment",
      "pk": [
        "id"
      ],
      "attrs": [
        "month",
        "amount"
      ]
    },
    {
      "name": "Timetable",
      "pk": [
        "id"
      ],
      "attrs": [
        "dayOfWeek",
        "startTime"
      ]
    },
    {
      "name": "ExamSchedule",
      "pk": [
        "id"
      ],
      "attrs": [
        "name",
        "examType"
      ]
    },
    {
      "name": "ExamResult",
      "pk": [
        "id"
      ],
      "attrs": [
        "marksObtained",
        "remarks"
      ]
    },
    {
      "name": "Notification",
      "pk": [
        "id"
      ],
      "attrs": [
        "title",
        "message"
      ]
    },
    {
      "name": "Activity",
      "pk": [
        "id"
      ],
      "attrs": [
        "action",
        "actionType"
      ]
    },
    {
      "name": "Book",
      "pk": [
        "id"
      ],
      "attrs": [
        "title",
        "author"
      ]
    },
    {
      "name": "BookCopy",
      "pk": [
        "id"
      ],
      "attrs": [
        "barcode",
        "status"
      ]
    },
    {
      "name": "BorrowRecord",
      "pk": [
        "id"
      ],
      "attrs": [
        "issueDate",
        "dueDate"
      ]
    },
    {
      "name": "BookHoldRequest",
      "pk": [
        "id"
      ],
      "attrs": [
        "requestDate",
        "fulfillmentDate"
      ]
    },
    {
      "name": "LibrarySettings",
      "pk": [
        "id"
      ],
      "attrs": [
        "issueLimit",
        "issuePeriodDays"
      ]
    },
    {
      "name": "LmsContent",
      "pk": [
        "id"
      ],
      "attrs": [
        "title",
        "description"
      ]
    },
    {
      "name": "LmsContentFile",
      "pk": [
        "id"
      ],
      "attrs": [
        "originalName",
        "filename"
      ]
    },
    {
      "name": "LmsSubmission",
      "pk": [
        "id"
      ],
      "attrs": [
        "status",
        "submittedAt"
      ]
    },
    {
      "name": "LmsSubmissionFile",
      "pk": [
        "id"
      ],
      "attrs": [
        "originalName",
        "filename"
      ]
    },
    {
      "name": "Vehicle",
      "pk": [
        "id"
      ],
      "attrs": [
        "registrationNo",
        "model"
      ]
    },
    {
      "name": "Route",
      "pk": [
        "id"
      ],
      "attrs": [
        "name",
        "monthlyFee"
      ]
    },
    {
      "name": "BusStop",
      "pk": [
        "id"
      ],
      "attrs": [
        "stopName",
        "location"
      ]
    },
    {
      "name": "StudentTransport",
      "pk": [
        "id"
      ],
      "attrs": [
        "pickupStop",
        "dropoffStop"
      ]
    },
    {
      "name": "MaintenanceRecord",
      "pk": [
        "id"
      ],
      "attrs": [
        "description",
        "cost"
      ]
    },
    {
      "name": "VehicleBoarding",
      "pk": [
        "id"
      ],
      "attrs": [
        "date",
        "studentCount"
      ]
    },
    {
      "name": "TransportSettings",
      "pk": [
        "id"
      ],
      "attrs": [
        "defaultMonthlyFee",
        "lateFeePercentage"
      ]
    },
    {
      "name": "Hostel",
      "pk": [
        "id"
      ],
      "attrs": [
        "name",
        "type"
      ]
    },
    {
      "name": "HostelRoom",
      "pk": [
        "id"
      ],
      "attrs": [
        "roomNumber",
        "floor"
      ]
    },
    {
      "name": "HostelBed",
      "pk": [
        "id"
      ],
      "attrs": [
        "bedNo",
        "status"
      ]
    },
    {
      "name": "HostelStudent",
      "pk": [
        "id"
      ],
      "attrs": [
        "checkInDate",
        "checkOutDate"
      ]
    },
    {
      "name": "HostelVisitor",
      "pk": [
        "id"
      ],
      "attrs": [
        "visitorName",
        "relation"
      ]
    },
    {
      "name": "HostelComplaint",
      "pk": [
        "id"
      ],
      "attrs": [
        "category",
        "subject"
      ]
    },
    {
      "name": "HostelLeave",
      "pk": [
        "id"
      ],
      "attrs": [
        "leaveFrom",
        "leaveTo"
      ]
    },
    {
      "name": "HostelNotice",
      "pk": [
        "id"
      ],
      "attrs": [
        "title",
        "content"
      ]
    },
    {
      "name": "HostelAttendance",
      "pk": [
        "id"
      ],
      "attrs": [
        "date",
        "isPresent"
      ]
    },
    {
      "name": "HostelSettings",
      "pk": [
        "id"
      ],
      "attrs": [
        "defaultMonthlyFee",
        "defaultDepositAmount"
      ]
    }
  ],
  "relationships": [
    {
      "from": "Class",
      "to": "AcademicYear",
      "name": "ACADEMIC_YEAR",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "Subject",
      "to": "Class",
      "name": "CLASS",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "Subject",
      "to": "Staff",
      "name": "TEACHER",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": false,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "Student",
      "to": "User",
      "name": "USER",
      "fromCard": "1",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "Student",
      "to": "Parent",
      "name": "PARENT",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": false,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "Student",
      "to": "Class",
      "name": "CLASS",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "RolePermission",
      "to": "Permission",
      "name": "PERMISSION",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "UserPermission",
      "to": "User",
      "name": "USER",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "UserPermission",
      "to": "Permission",
      "name": "PERMISSION",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "StudentPromotion",
      "to": "Student",
      "name": "STUDENT",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "StudentTransfer",
      "to": "Student",
      "name": "STUDENT",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "Parent",
      "to": "User",
      "name": "USER",
      "fromCard": "1",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "Staff",
      "to": "User",
      "name": "USER",
      "fromCard": "1",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "Attendance",
      "to": "Student",
      "name": "STUDENT",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "Attendance",
      "to": "Class",
      "name": "CLASS",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "Leave",
      "to": "Staff",
      "name": "STAFF",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "FeeStructure",
      "to": "AcademicYear",
      "name": "ACADEMIC_YEAR",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "FeePayment",
      "to": "Student",
      "name": "STUDENT",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "FeePayment",
      "to": "FeeStructure",
      "name": "FEE_STRUCTURE",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "SalaryPayment",
      "to": "Staff",
      "name": "STAFF",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "Timetable",
      "to": "Class",
      "name": "CLASS",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "Timetable",
      "to": "Subject",
      "name": "SUBJECT",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "Timetable",
      "to": "Staff",
      "name": "TEACHER",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "ExamSchedule",
      "to": "Class",
      "name": "CLASS",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "ExamSchedule",
      "to": "AcademicYear",
      "name": "ACADEMIC_YEAR",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "ExamResult",
      "to": "Student",
      "name": "STUDENT",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "ExamResult",
      "to": "ExamSchedule",
      "name": "EXAM_SCHEDULE",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "ExamResult",
      "to": "Subject",
      "name": "SUBJECT",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "BookCopy",
      "to": "Book",
      "name": "BOOK",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "BorrowRecord",
      "to": "Book",
      "name": "BOOK",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "BookHoldRequest",
      "to": "Book",
      "name": "BOOK",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "LmsContent",
      "to": "Class",
      "name": "CLASS",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "LmsContent",
      "to": "Subject",
      "name": "SUBJECT",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "LmsContent",
      "to": "Staff",
      "name": "TEACHER",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "LmsContentFile",
      "to": "LmsContent",
      "name": "CONTENT",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "LmsSubmission",
      "to": "LmsContent",
      "name": "CONTENT",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "LmsSubmission",
      "to": "Student",
      "name": "STUDENT",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "LmsSubmissionFile",
      "to": "LmsSubmission",
      "name": "SUBMISSION",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "Route",
      "to": "Vehicle",
      "name": "VEHICLE",
      "fromCard": "1",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "BusStop",
      "to": "Route",
      "name": "ROUTE",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "StudentTransport",
      "to": "Route",
      "name": "ROUTE",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "MaintenanceRecord",
      "to": "Vehicle",
      "name": "VEHICLE",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "VehicleBoarding",
      "to": "Vehicle",
      "name": "VEHICLE",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "HostelRoom",
      "to": "Hostel",
      "name": "HOSTEL",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "HostelBed",
      "to": "HostelRoom",
      "name": "ROOM",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "HostelStudent",
      "to": "Hostel",
      "name": "HOSTEL",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    },
    {
      "from": "HostelNotice",
      "to": "Hostel",
      "name": "HOSTEL",
      "fromCard": "N",
      "toCard": "1",
      "totalFrom": true,
      "totalTo": false,
      "identifying": false
    }
  ]
};
