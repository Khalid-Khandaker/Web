import { 
    signOutUser, checkAssignedSection, getAuthentication,
    getEnrolledStudents, getStudentPerformance
} from "./utils/firebase";

const signOutProfessorButton = document.querySelector('.teacher-header p');
const sectionNavigationContainer = document.querySelector('.section-navigation-container');
const studentTableDataContainer = document.querySelector('.student-table-data-container'); 
const highestLatestModal = document.querySelector('.highest-latest-modal-container'); 
const highestPerformanceModal = document.querySelector('.highest-performance-modal-container');
const latestPerformanceModal = document.querySelector('.latest-performance-modal-container');
const highestButton = document.querySelector('.highest-button');
const latestButton = document.querySelector('.latest-button');
const highestPerformanceModuleNavigation = document.querySelector('.highest-performance-modal-module-navigation-container');
const latestPerformanceModuleNavigation = document.querySelector('.latest-performance-modal-module-navigation-container');

let sectionButtonArray = []; 
let sectionPage = "";

// We have to set a delay to give Firebase server time to recover data from the reload.
setTimeout(async () => {
    let authentication = getAuthentication();
    let professorName = authentication.currentUser.displayName;

    try {
        const assignedSections = await checkAssignedSection(professorName);
        
        if (assignedSections !== "No assigned sections") {
            const firstSection = assignedSections[0];
            sectionPage = firstSection;

            for (const assignedSectionName of assignedSections) {
                const sectionNavigationButton = createElementWithText('div', `<p>${assignedSectionName}</p>`, 'section-navigation-button');
                sectionNavigationContainer.appendChild(sectionNavigationButton);

                sectionButtonArray.push(sectionNavigationButton);

                if (assignedSectionName === firstSection) {
                    sectionNavigationButton.style.borderBottom = '4px solid #ad1f48';
                }
            }

            // Wait for getEnrolledStudents to finish before continuing to the next section
            const studentsEnrolledRecordArray = await getEnrolledStudents(firstSection);

            for (const studentsEnrolledRecord of studentsEnrolledRecordArray) {
                const studentTableData = createElementWithText('div', '', 'student-table-data');

                studentTableData.appendChild(createElementWithText('div', `<p>${studentsEnrolledRecord.idNum}</p>`, 'student-number-container'));
                studentTableData.appendChild(createElementWithText('div', `<p>${studentsEnrolledRecord.name}</p>`, 'student-name-container'));
                studentTableData.appendChild(createElementWithText('div', `<p>${studentsEnrolledRecord.section}</p>`, 'student-rank-container'));
                studentTableData.appendChild(createElementWithText('div', `<p>${studentsEnrolledRecord.uid}</p>`, 'student-points-container'));

                studentTableData.appendChild(createElementWithImage('div', '../Assets/Icons/delete_icon.svg', 'Delete', 'student-delete-container'));

                studentTableDataContainer.appendChild(studentTableData);
            }
            
        } else {
            console.log(assignedSections);
        }
    } catch (error) {
        console.error("Error fetching assigned sections or enrolled students:", error);
    }
}, 1000);

// Event listener for clicks on section navigation container
sectionNavigationContainer.addEventListener('click', sectionNavigationContainerHandler);
//Dont forget this code...
function sectionNavigationContainerHandler(sectionNavigationContainerEvent) {
    let sectionName = "";
    // Ensure the clicked element is a section-navigation-button
    if (sectionNavigationContainerEvent.target.classList.contains('section-navigation-button') || sectionNavigationContainerEvent.target.parentElement.classList.contains('section-navigation-button')) {
        
        // Remove the border from all buttons
        sectionButtonArray.forEach(button => {
            button.style.borderBottom = '';
        });

        // Add the border to the clicked button
        const clickedButton = sectionNavigationContainerEvent.target.closest('.section-navigation-button');
        clickedButton.style.borderBottom = '4px solid #ad1f48';

        sectionName = sectionNavigationContainerEvent.target.textContent;
        sectionPage = sectionName;
    }

    getEnrolledStudents(sectionName).then((enrolledStudentsArray) => {
        studentTableDataContainer.innerHTML = "";
        enrolledStudentsArray.forEach((enrolledStudentsRecords) => {
            const studentTableData = createElementWithText('div', '', 'student-table-data');

            studentTableData.appendChild(createElementWithText('div', `<p>${enrolledStudentsRecords.idNum}</p>`, 'student-number-container'));
            studentTableData.appendChild(createElementWithText('div', `<p>${enrolledStudentsRecords.name}</p>`, 'student-name-container'));
            studentTableData.appendChild(createElementWithText('div', `<p>${enrolledStudentsRecords.section}</p>`, 'student-rank-container'));
            studentTableData.appendChild(createElementWithText('div', `<p>${enrolledStudentsRecords.section}</p>`, 'student-points-container'));

            studentTableData.appendChild(createElementWithImage('div', '../Assets/Icons/delete_icon.svg', 'Delete', 'student-delete-container'));

            studentTableDataContainer.appendChild(studentTableData);
        })
    })
}

studentTableDataContainer.addEventListener('click', studentTableDataContainerHandler);
function studentTableDataContainerHandler(studentTableDataContainerEvent) {
    const studentTableDataElement = studentTableDataContainerEvent.target;
    const studentNumber = studentTableDataElement.querySelector('.student-name-container'); 

    highestLatestModal.style.display = 'flex';

    console.log("Inside student table data container handler");

    document.querySelector('.highest-latest-modal-close').addEventListener('click', function () {
        highestLatestModal.style.display = 'none';
    });

    wakeHighestButton();
    wakeLatestButton();

    // getStudentPerformance()
}
function wakeHighestButton() {
    highestButton.addEventListener('click', highestButtonHandler);
}
function highestButtonHandler() {
    highestPerformanceModal.style.display = 'flex';

    console.log("Inside highest button handler");

    document.querySelector('.highest-performance-modal-close-container').addEventListener('click', function() {
        changeHighestModuleNavigationSpotlight("Module 1");
        highestPerformanceModal.style.display = 'none';
    });

    wakeHighestPerformanceModuleNavigation();
}
function wakeLatestButton() {
    latestButton.addEventListener('click', latestButtonHandler);
}
function latestButtonHandler() {
    latestPerformanceModal.style.display = 'flex';

    console.log("Inside latest button handler");

    document.querySelector('.latest-performance-modal-close-container').addEventListener('click', function() {
        changeLatestModuleNavigationSpotlight("Module 1");
        latestPerformanceModal.style.display = 'none';
    });

    wakeLatestPerformanceModuleNavigation();
}

function wakeHighestPerformanceModuleNavigation() { 
    highestPerformanceModuleNavigation.addEventListener('click', highestPerformanceModuleNavigationHandler);
}
function highestPerformanceModuleNavigationHandler(highestPerformanceModuleNavigationEvent) {
    let moduleName = highestPerformanceModuleNavigationEvent.target.textContent;

    console.log(moduleName);

    changeHighestModuleNavigationSpotlight(moduleName);
}

function wakeLatestPerformanceModuleNavigation() {
    latestPerformanceModuleNavigation.addEventListener('click', latestPerformanceModuleNavigationHandler);
}
function latestPerformanceModuleNavigationHandler(latestPerformanceModuleNavigationEvent) {
    let moduleName = latestPerformanceModuleNavigationEvent.target.textContent;

    changeLatestModuleNavigationSpotlight(moduleName);
}
const changeHighestModuleNavigationSpotlight = (moduleName) => {
    document.querySelector('.highest-performance-module-one > p').style.setProperty('--after-background', 'transparent');
    document.querySelector('.highest-performance-module-two > p').style.setProperty('--after-background', 'transparent');
    document.querySelector('.highest-performance-module-three > p').style.setProperty('--after-background', 'transparent');

    if(moduleName == "Module 1") {
        document.querySelector('.highest-performance-module-one > p').style.setProperty('--after-background', '#ad1f48');
    } else if(moduleName == "Module 2") {
        document.querySelector('.highest-performance-module-two > p').style.setProperty('--after-background', '#ad1f48');
    } else if(moduleName == "Module 3") {
        document.querySelector('.highest-performance-module-three > p').style.setProperty('--after-background', '#ad1f48');
    }
}

const changeLatestModuleNavigationSpotlight = (moduleName) => {
    document.querySelector('.latest-performance-module-one > p').style.setProperty('--after-background', 'transparent');
    document.querySelector('.latest-performance-module-two > p').style.setProperty('--after-background', 'transparent');
    document.querySelector('.latest-performance-module-three > p').style.setProperty('--after-background', 'transparent');

    if(moduleName == "Module 1") {
        document.querySelector('.latest-performance-module-one > p').style.setProperty('--after-background', '#ad1f48');
    } else if(moduleName == "Module 2") {
        document.querySelector('.latest-performance-module-two > p').style.setProperty('--after-background', '#ad1f48');
    } else if(moduleName == "Module 3") {
        document.querySelector('.latest-performance-module-three > p').style.setProperty('--after-background', '#ad1f48');
    }
} 

const createElementWithText = (tag, text, className) => {
    const element = document.createElement(tag);
    element.className = className;
    element.innerHTML = text;
    return element;
};
const createElementWithImage = (tag, imageUrl, altText, className) => {
    const element = document.createElement(tag);
    element.className = className;

    const imageElement = document.createElement('img');
    imageElement.src = imageUrl;
    imageElement.alt = altText;

    element.appendChild(imageElement);

    return element;
};
signOutProfessorButton.addEventListener('click', function () {
  signOutUser().then((homepage) => {
    window.location.href = homepage;
  });
}, { once: true });
