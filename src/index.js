//Importing Functions From firebase.js
import { getProfessorDetails, addSection, signOutUser, 
    getAssignedStudents, deleteSection, updateClassSectionName,
    getProfessorTableDocuments, getClassSectionTableDocuments, addCreateProfessor,
    updateProfessorHandledSections, getProfessorHandledSections, deleteProfessor,
    getStudentTableDocuments, createStudentAccount, getStudentData
} from "./utils/firebase";

//The array below are used to prevent click stacking.
let addEntityClicks = [];
let deleteQueue = [];
let renameQueue = [];
let renameQueueOne = [];
let debounceTimeout;

//Start of Admin Home Initializing DOM Elements Block
const addEntityButton = document.querySelector(".add-entity-button");
const logoutButton = document.querySelector(".header p");
const confirmDeletionButton = document.querySelector('.confirm-deletion-modal-confirm-button');
const confirmDeletionModal = document.querySelector('.confirm-deletion-modal-container');
const professorNavigationButton = document.querySelector('.professors-text-container');
const classSectionNavigationButton = document.querySelector('.sections-text-container');



//Start of Professor Table Modals
const addProfessorModal = document.querySelector(".add-professor-modal-container");
const professorTableDataContainer = document.querySelector('.professor-table-data-container');
const editProfessorModal = document.querySelector(".edit-professor-modal-container");
const addSectionButton = document.querySelector(".edit-professor-modal-add-section-button");
const addSectionModal = document.querySelector(".add-section-modal-container");
const deleteSectionButton = document.querySelector(".edit-professor-modal-delete-section-button");
const deleteSectionModal = document.querySelector(".delete-section-modal-container");
const assignSectionButton = document.querySelector(".add-professor-modal-assign-section-button");
const assignSectionModal = document.querySelector(".assign-section-modal-container");
const addProfessorForm = document.querySelector(".add-professor-form");
const editProfessorForm = document.querySelector('.edit-professor-form');
const addProfessorConfirm = document.querySelector(".add-professor-modal-confirm-button");
const removeSectionModal = document.querySelector('.remove-section-modal-container');
const removeSectionButton = document.querySelector('.add-professor-modal-remove-section-button');
const professorTable = document.querySelector('.professor-table');
const assignSectionForm = document.querySelector('.assign-section-form');
const removeSectionForm = document.querySelector('.remove-section-form');
const assignedSectionsContainer = document.querySelector('.add-professor-modal-section-inner-container'); 
const handledSectionsContainer = document.querySelector('.edit-professor-modal-section-inner-container');
const editProfessorHeader = document.querySelector('.edit-professor-modal-title');
const deleteHandledSectionButton = document.querySelector('.edit-professor-modal-delete-section-button');
const addHandledSectionButton = document.querySelector('.edit-professor-modal-add-section-button');
const deleteSectionForm = document.querySelector('.delete-section-form');
const addSectionForm = document.querySelector('.add-section-form');
const deleteProfessorButton = document.querySelector('.edit-professor-modal-delete-button');
const confirmEditProfessorButton = document.querySelector('.edit-professor-modal-confirm-button');
//End of Professor Table Modals

//Start of Student Table Modals
const addStudentModal = document.querySelector(".add-student-modal-container");
const editStudentModal = document.querySelector('.edit-student-modal-container');
const studentTableDataContainer = document.querySelector('.student-table-data-container');
const studentNavigationButton = document.querySelector('.students-text-container');
const studentTable = document.querySelector('.student-table');
const addStudentForm = document.querySelector('.add-student-form');
const studentNameInput = document.querySelector('#student-name-input');
const studentEmailInput = document.querySelector('#student-email-input');
const studentIdNumberInput = document.querySelector('#student-idnumber-input');
const studentSectionInput = document.querySelector('#student-section-input');
const studentPasswordInput = document.querySelector('#student-password-input');
//End of Student Table Modals

//Start of Class Section Table Modals
const addClassSectionModal = document.querySelector(".add-class-section-modal-container");
const addClassSectionForm = document.querySelector(".add-class-section-form");
const classSectionTableDataContainer = document.querySelector('.class-section-table-data-container');
const editClassSectionModal = document.querySelector('.edit-class-section-modal-container');
const editClassSectionModalTableDataContainer = document.querySelector('.edit-class-section-modal-table-data-container');
const editClassSectionModalDeleteButton = document.querySelector('.edit-class-section-modal-delete-button');
const editClassSectionModalRenameButton = document.querySelector('.edit-class-section-modal-rename-button');
const closeEditClassSectionModal = document.querySelector('.edit-class-section-close-container');
const renameClassSectionModal = document.querySelector('.rename-section-modal-container');
const renameClassSectionForm = document.querySelector('.rename-section-form');
const classSectionTable = document.querySelector('.class-section-table');
//End of Class Section Table Modals
//End of Admin Home Initializing DOM Elements Block

initializeHomepage();
function initializeHomepage() {

    initializeClassSectionTable();
    wakeClassSectionNavigationButton();
    wakeClassSectionTableDataContainer();
    
    initializeStudentTable();
    wakeStudentNavigationButton();
    wakeStudentTableDataContainer();

    initializeProfessorTable();
    wakeProfessorNavigationButton(); 
    wakeProfessorTableDataContainer();

    wakeAddEntityButton("initialization");// Add button default.
}

//CLASS SECTION BLOCK
function initializeClassSectionTable() {
    classSectionTableDataContainer.innerHTML = ""; 
    getClassSectionTableDocuments().then((sectionsData) => {
        sectionsData.forEach((sectionData) => {
            // Create the main container
            const classSectionTableData = createElementWithText('div', '', 'class-section-table-data');
            // Create and append child containers
            classSectionTableData.appendChild(createElementWithText('div', `<p>${sectionData.name}</p>`, 'class-section-name-container'));
            classSectionTableData.appendChild(createElementWithText('div', `<p>${sectionData.studentCount} / 40</p>`, 'class-section-slot-container'));
            classSectionTableData.appendChild(createElementWithText('div', `<p>${sectionData.assignedTo}</p>`, 'class-section-assigned-to-container'));

            classSectionTableDataContainer.appendChild(classSectionTableData); 
        })
    });
}




function wakeClassSectionNavigationButton() {
    classSectionNavigationButton.addEventListener('click', classSectionNavigationButtonHandler);
} 
function classSectionNavigationButtonHandler() {
    initializeClassSectionTable();
    document.querySelector('.sections-text-container > p').style.setProperty('--after-background', '#ad1f48');
    document.querySelector('.professors-text-container > p').style.setProperty('--after-background', 'transparent');
    document.querySelector('.students-text-container > p').style.setProperty('--after-background', 'transparent');

    classSectionTable.style.display = "grid";
    professorTable.style.display = "none";
    studentTable.style.display = "none";

    
    wakeAddEntityButton("classSection");

    classSectionNavigationButton.removeEventListener('click', classSectionNavigationButtonHandler);
    wakeClassSectionNavigationButton();
}




function addClassSectionFormHandler(addSectionFormHandlerEvent) {
    addSectionFormHandlerEvent.preventDefault();
    
    const classSectionName = addClassSectionForm.class_section_name.value;

    addSection(classSectionName).then((successMessage) => {
        initializeClassSectionTable();
        addClassSectionForm.reset();
        
        addClassSectionModal.style.display = "none";
        
        console.log(successMessage);
        })
        .catch((err) => {
            console.error("Error adding class section:", err.message);
        });

    addClassSectionForm.removeEventListener('submit', addClassSectionFormHandler);
    addEntityButton.removeEventListener('click', wakeAddEntityButton);

    wakeAddEntityButton("classSection"); 
}




function wakeClassSectionTableDataContainer() {
    classSectionTableDataContainer.addEventListener('click', classSectionTableDataContainerHandler);
}
function classSectionTableDataContainerHandler(classSectionTableDataContainerHandlerEvent) {
    const classSectionName = classSectionTableDataContainerHandlerEvent.target.querySelector('.class-section-name-container').textContent;
    editClassSectionModalTableDataContainer.innerHTML = "";
    getAssignedStudents(classSectionName).then((assignedStudents) => {
        assignedStudents.forEach((student) => {
            const editClassSectionModalTableData = createElementWithText('div', '', 'edit-class-section-modal-table-data');
            
            editClassSectionModalTableData.appendChild(createElementWithText('div', `<p>${student.idNumber}</p>`, 'edit-class-section-modal-table-data-student-id'));
            editClassSectionModalTableData.appendChild(createElementWithText('div', `<p>${student.name}</p>`, 'edit-class-section-modal-table-data-student-name'));
            
            editClassSectionModalTableDataContainer.appendChild(editClassSectionModalTableData);
        });
    }).catch((error) => {

    });
    
    editClassSectionModal.style.display = "flex";

    closeEditClassSectionModal.addEventListener('click', function () {
        editClassSectionModal.style.display = "none";
    });
    wakeEditClassSectionModalRenameButton(classSectionName);
    wakeEditClassSectionModalDeleteButton(classSectionName);
}




function wakeEditClassSectionModalRenameButton(classSectionName) {
    editClassSectionModalRenameButton.addEventListener('click', () => editClassSectionModalRenameButtonHandler(classSectionName), {once : true});
    renameQueue.push(classSectionName);
}
function editClassSectionModalRenameButtonHandler(classSectionName) {
    if(renameQueue.length == 1) {
        renameClassSectionModal.style.display = "flex";

        document.querySelector('.rename-section-modal-close-container').addEventListener('click', function () {
            renameClassSectionModal.style.display = "none";
            wakeEditClassSectionModalRenameButton(classSectionName);
        });

        renameClassSectionForm.addEventListener('submit', (renameClassSectionFormHandlerEvent) => renameClassSectionFormHandler(renameClassSectionFormHandlerEvent, classSectionName), {once : true});
        renameQueueOne.push(classSectionName);
    }
    renameQueue.pop();  
}
function renameClassSectionFormHandler(renameClassSectionFormHandlerEvent, classSectionName) {
    if(renameQueueOne.length == 1) {
        renameClassSectionFormHandlerEvent.preventDefault();

        const newClassSectionName = renameClassSectionForm.new_class_section_name.value;
    
        updateClassSectionName(classSectionName, newClassSectionName).then((message) => {
            renameClassSectionForm.reset();

            console.log(message);
            
            initializeClassSectionTable();
        });
        renameClassSectionModal.style.display = "none";
        editClassSectionModal.style.display = "none";
        classSectionTableDataContainer.removeEventListener('click', classSectionTableDataContainerHandler);
        wakeClassSectionTableDataContainer();
    }
    renameQueueOne.pop();
}




function wakeEditClassSectionModalDeleteButton(classSectionName) {
    editClassSectionModalDeleteButton.addEventListener('click', () => editClassSectionModalDeleteButtonHandler(classSectionName), {once : true});
    deleteQueue.push(classSectionName);
}
function editClassSectionModalDeleteButtonHandler(classSectionName) {
    if(deleteQueue.length == 1) {
        deleteSection(classSectionName).then((message) => {
            console.log(message);
            initializeClassSectionTable();
        })
        editClassSectionModal.style.display = "none";
        classSectionTableDataContainer.removeEventListener('click', classSectionTableDataContainerHandler);
        wakeClassSectionTableDataContainer();
    }
    deleteQueue.pop();
}
//END OF CLASS SECTION BLOCK

//STUDENT BLOCK
function initializeStudentTable() {
    studentTableDataContainer.innerHTML = "";

    getStudentTableDocuments()
        .then((studentsData) => {
            studentsData.forEach((studentData) => {
                const studentTableData = createElementWithText('div', '', 'student-table-data');
                
                studentTableData.appendChild(createElementWithText('div', `<p>${studentData.idNum}</p>`, 'student-id-container'));
                studentTableData.appendChild(createElementWithText('div', `<p>${studentData.name}</p>`, 'student-name-container'));
                studentTableData.appendChild(createElementWithText('div', `<p>${studentData.section}</p>`, 'student-section-container'));

                studentTableDataContainer.appendChild(studentTableData); 
            });
        })
        .catch((error) => {
            console.error("Failed to initialize student table:", error);
        });
}





function wakeStudentNavigationButton() {
    studentNavigationButton.addEventListener('click', studentNavigationButtonHandler);
} 
function studentNavigationButtonHandler() {
    document.querySelector('.sections-text-container > p').style.setProperty('--after-background', 'transparent');
    document.querySelector('.professors-text-container > p').style.setProperty('--after-background', 'transparent');
    document.querySelector('.students-text-container > p').style.setProperty('--after-background', '#ad1f48');

    studentTable.style.display = "grid";
    classSectionTable.style.display = "none";
    professorTable.style.display = "none";
    
    wakeAddEntityButton("student");

    studentNavigationButton.removeEventListener('click', studentNavigationButtonHandler);
    wakeStudentNavigationButton();
}




function wakeStudentTableDataContainer() {
    studentTableDataContainer.addEventListener('click', (studentTableDataContainerEvent) => studentTableDataContainerHandler(studentTableDataContainerEvent));
}
function studentTableDataContainerHandler(studentTableDataContainerEvent) {
    studentTableDataContainerEvent.preventDefault();
    const studentId = studentTableDataContainerEvent.target.querySelector('.student-id-container').textContent;

    getStudentData(studentId).then((studentDataArray) => {
        if (studentDataArray) {
            const [idNum, name, section] = studentDataArray;

            studentNameInput.placeholder = name;
            studentIdNumberInput.placeholder = idNum;
            studentSectionInput.placeholder = section;

            editStudentModal.style.display = "flex";
        } else {
            console.log("Student data not found.");
        }
    }).catch((error) => {
        console.error("Error fetching student data:", error);
    });

    document.querySelector('.edit-student-modal-close-container').addEventListener('click', function() {
        editStudentModal.style.display = "none";

        studentTableDataContainer.removeEventListener('click', (studentTableDataContainerEvent) => studentTableDataContainerHandler(studentTableDataContainerEvent));
        wakeStudentTableDataContainer();
    });

    //Wake delete account button
    //Wake Update button 


}
//END OF STUDENT BLOCK




//PROFESSOR BLOCK
function initializeProfessorTable() {
    professorTableDataContainer.innerHTML = "";
    getProfessorTableDocuments().then((professorsData) => {
        professorsData.forEach((professor) => {
            const professorTableData = createElementWithText('div', '', 'professor-table-data');
            professorTableData.appendChild(createElementWithText('div', `<p>${professor.name}</p>`, 'professor-name-container'));
            
            const professorHandledSection = createElementWithText('div', '', 'professor-handled-section-container');

            if (Array.isArray(professor.handledSections) && professor.handledSections.length > 0) {
                // Display all handled sections if available
                professor.handledSections.forEach((section) => {
                    professorHandledSection.appendChild(createElementWithText('div', `<p>${section.name}</p>`, 'handled-section'));
                });
            } else {
                // Display a default message if no handled sections are found
                professorHandledSection.appendChild(createElementWithText('div', `<p>No Handled Sections</p>`, 'no-handled-sections'));
            }

            professorTableData.appendChild(professorHandledSection);
            professorTableDataContainer.appendChild(professorTableData);
        });
    });
}





function wakeProfessorNavigationButton() {
    professorNavigationButton.addEventListener('click', professorNavigationButtonHandler);
} 
function professorNavigationButtonHandler() {
    document.querySelector('.students-text-container > p').style.setProperty('--after-background', 'transparent');
    document.querySelector('.professors-text-container > p').style.setProperty('--after-background', '#ad1f48');
    document.querySelector('.sections-text-container > p').style.setProperty('--after-background', 'transparent');

    studentTable.style.display = "none";
    professorTable.style.display = "grid";
    classSectionTable.style.display = "none";

    wakeAddEntityButton("professor");

    professorNavigationButton.removeEventListener('click', professorNavigationButtonHandler);
    wakeProfessorNavigationButton();
}



//ADD PROFESSOR FORM HANDLER
function addProfessorFormHandler(addProfessorFormHandlerEvent, assignedSectionsArray) {
    addProfessorFormHandlerEvent.preventDefault();
  
    const professorName = addProfessorForm.professor_name.value;
    const professorEmail = addProfessorForm.professor_email.value;
    const professorPassword = addProfessorForm.professor_password.value;

    addCreateProfessor(professorName, professorEmail, professorPassword, assignedSectionsArray).then((message) => {
        initializeProfessorTable();
        
        addProfessorForm.reset();

        assignedSectionsContainer.innerHTML = "";

        addProfessorModal.style.display = "none";

        console.log(message);
    })
    .catch((error) => {
        console.error("Error:", error.message);

        addProfessorForm.reset();

        assignedSectionsContainer.innerHTML = "";

        addProfessorModal.style.display = "none";
    });
    // Clear all elements from assignedSectionsArray

    addEntityButton.removeEventListener('click', wakeAddEntityButton);

    console.log("Inside add professor form handler");
}







//This function will wake assignSection button inside the add professor modal
function wakeAssignSectionButton(assignedSectionsArray) {
    assignSectionButton.addEventListener('click', () => {
        clearTimeout(debounceTimeout); // Clear any previous timeout
        debounceTimeout = setTimeout(() => {
            assignSectionHandler(assignedSectionsArray);
        }, 300); // Adjust delay as needed
    });
}
function assignSectionHandler(assignedSectionsArray) {
    assignSectionModal.style.display = "flex";

    // Add a one-time event listener for the form submit
    assignSectionForm.addEventListener('submit', (assignSectionFormHandlerEvent) => {
        assignSectionFormHandler(assignSectionFormHandlerEvent, assignedSectionsArray);
    }, { once: true });

    // Add a click listener for the close button
    document.querySelector('.assign-section-modal-close-container').addEventListener('click', function () {
        assignSectionModal.style.display = "none";

        // Clean up event listeners
        assignSectionButton.removeEventListener('click', () => assignSectionHandler(assignedSectionsArray));
        assignSectionForm.removeEventListener('submit', (assignSectionFormHandlerEvent) => assignSectionFormHandler(assignSectionFormHandlerEvent, assignedSectionsArray));
    });

    console.log("Inside assign section modal");
}

function assignSectionFormHandler(assignSectionFormHandlerEvent, assignedSectionsArray) {
    const assignedSection = assignSectionForm.section_to_be_assigned.value;

    if (assignedSection !== "") {
        assignSectionFormHandlerEvent.stopPropagation();
        assignSectionFormHandlerEvent.preventDefault();
        assignSectionForm.reset();

        // Check for duplicates in the array
        if (assignedSectionsArray.includes(assignedSection)) {
            throw new Error(`Section "${assignedSection}" is already assigned.`);
        }

        assignedSectionsArray.push(assignedSection);

        initializeAssignedSectionsArray(assignedSectionsArray);

        assignSectionModal.style.display = "none";

        console.log("Section pushed into the array successfully");
        console.log(assignedSection);
    }
}
//End





//This function will wake the remove section button inside the add professor modal.
function wakeRemoveSectionButton(assignedSectionsArray) {
    removeSectionButton.addEventListener('click', () => {
        clearTimeout(debounceTimeout); // Clear any previous timeout
        debounceTimeout = setTimeout(() => {
            removeSectionButtonHandler(assignedSectionsArray);
        }, 300); // Adjust delay as needed
    });
}
function removeSectionButtonHandler(assignedSectionsArray) {
    removeSectionModal.style.display = "flex";

    removeSectionForm.addEventListener('submit', (removeSectionFormEvent) => removeSectionFormHandler(removeSectionFormEvent, assignedSectionsArray));

    document.querySelector('.remove-section-modal-close-container').addEventListener('click', function () {
        removeSectionModal.style.display = "none";

        removeSectionForm.removeEventListener('submit', (removeSectionFormEvent) => removeSectionFormHandler(removeSectionFormEvent, assignedSectionsArray));
    });

    removeSectionButton.removeEventListener('click', () => removeSectionButtonHandler(assignedSectionsArray), {once : true});
    wakeRemoveSectionButton();

    console.log("Inside remove section modal");
}
function removeSectionFormHandler(removeSectionFormHandler, assignedSectionsArray) {
    const sectionToRemove = removeSectionForm.section_to_remove.value;

    if (sectionToRemove !== "") {
        removeSectionFormHandler.preventDefault();
        removeSectionFormHandler.stopPropagation();
        removeSectionForm.reset();

        const index = assignedSectionsArray.indexOf(sectionToRemove);

        // Check if the section exists in the array
        if (index !== -1) {
            // Remove the section from the array
            assignedSectionsArray.splice(index, 1);
            initializeAssignedSectionsArray(assignedSectionsArray);
            console.log("Section removed successfully");
        } else {
            // Throw an error if the section does not exist
            throw new Error(`Section "${sectionToRemove}" does not exist in the assigned sections array.`);
        }
        removeSectionModal.style.display = "none";
    }
}
//End





function initializeAssignedSectionsArray(assignedSectionsArray) {
    assignedSectionsContainer.innerHTML = "";
    assignedSectionsArray.forEach((sectionName) => {
        const section = createElementWithText('div', `<p>${sectionName}</p>`, 'add-professor-modal-section');
        assignedSectionsContainer.appendChild(section);
    });
}




//This function listens to professor table data clicks and display edit modal.
function wakeProfessorTableDataContainer() {
    professorTableDataContainer.addEventListener('click', professorTableDataContainerHandler);
}
function professorTableDataContainerHandler(professorTableDataContainerHandlerEvent) {
    const professorName = professorTableDataContainerHandlerEvent.target.querySelector('.professor-name-container').textContent;
    editProfessorHeader.innerHTML = `<p>Editing ${professorName} Account</p>`;
    handledSectionsContainer.innerHTML = "";

    let assignedSectionsArray = [];

    getProfessorHandledSections(professorName).then((handledSectionsName) => {
        handledSectionsName.forEach((sectionName) => {
            assignedSectionsArray.push(sectionName);

            const sectionContainer = createElementWithText('div', `<p>${sectionName}</p>` ,'edit-professor-modal-section');
            handledSectionsContainer.appendChild(sectionContainer);
        });
        editProfessorModal.style.display = "flex";
    });

    document.querySelector('.edit-professor-modal-close-container').addEventListener('click', function () {
        deleteHandledSectionButton.removeEventListener('click', () => deleteHandledSectionButtonHandler(assignedSectionsArray, professorName));
        addHandledSectionButton.removeEventListener('click', () => addHandledSectionButtonHandler(assignedSectionsArray, professorName));
        professorTableDataContainer.removeEventListener('click', professorTableDataContainerHandler);
        deleteProfessorButton.removeEventListener('click', () => deleteProfessorButtonHandler(professorName));
        confirmEditProfessorButton.removeEventListener('click', () => wakeConfirmEditProfessorButtonHandler(assignedSectionsArray, professorName));

        editProfessorModal.style.display = "none";

        wakeProfessorTableDataContainer();
    });

    wakeAddSectionButton(assignedSectionsArray, professorName);
    wakeDeleteSectionButton(assignedSectionsArray, professorName);

    wakeDeleteProfessorButton(professorName);
    wakeConfirmEditProfessorButton(assignedSectionsArray, professorName);
}




function wakeConfirmEditProfessorButton(assignedSectionsArray, professorName) {
    confirmEditProfessorButton.addEventListener('click', () => wakeConfirmEditProfessorButtonHandler(assignedSectionsArray, professorName));
}
function wakeConfirmEditProfessorButtonHandler(assignedSectionsArray, professorName) {
    deleteHandledSectionButton.removeEventListener('click', () => deleteHandledSectionButtonHandler(assignedSectionsArray, professorName));
    addHandledSectionButton.removeEventListener('click', () => addHandledSectionButtonHandler(assignedSectionsArray, professorName));
    professorTableDataContainer.removeEventListener('click', professorTableDataContainerHandler);
    deleteProfessorButton.removeEventListener('click', () => deleteProfessorButtonHandler(professorName));
    confirmEditProfessorButton.removeEventListener('click', () => wakeConfirmEditProfessorButtonHandler(assignedSectionsArray, professorName));

    updateProfessorHandledSections(professorName, assignedSectionsArray).then((message) => {
        console.log(message);

        initializeProfessorTable();
        editProfessorModal.style.display = "none";
    });
    wakeProfessorTableDataContainer();
}




function wakeDeleteProfessorButton(professorName) {
    deleteProfessorButton.addEventListener('click', () => deleteProfessorButtonHandler(professorName));
}
function deleteProfessorButtonHandler(professorName) {
    deleteProfessor(professorName).then((message) => {
        deleteHandledSectionButton.removeEventListener('click', () => deleteHandledSectionButtonHandler(assignedSectionsArray, professorName));
        addHandledSectionButton.removeEventListener('click', () => addHandledSectionButtonHandler(assignedSectionsArray, professorName));
        professorTableDataContainer.removeEventListener('click', professorTableDataContainerHandler);
        deleteProfessorButton.removeEventListener('click', () => deleteProfessorButtonHandler(professorName));
        confirmEditProfessorButton.removeEventListener('click', () => wakeConfirmEditProfessorButtonHandler(assignedSectionsArray, professorName));

        editProfessorModal.style.display = "none";
    })
}




function wakeDeleteSectionButton(assignedSectionsArray, professorName) {
    deleteHandledSectionButton.addEventListener('click', () => deleteHandledSectionButtonHandler(assignedSectionsArray, professorName));
}
function deleteHandledSectionButtonHandler(assignedSectionsArray, professorName) {
    deleteSectionModal.style.display = "flex";

    document.querySelector('.delete-section-modal-close-container').addEventListener('click', function() {
        deleteSectionModal.style.display = "none";  
    });

    deleteSectionForm.addEventListener('submit', (deleteSectionFormEvent) => deleteSectionFormHandler(deleteSectionFormEvent, assignedSectionsArray, professorName));

    deleteHandledSectionButton.removeEventListener('click', () => deleteHandledSectionButtonHandler(assignedSectionsArray, professorName));
    wakeDeleteSectionButton();
}
function deleteSectionFormHandler(deleteSectionFormEvent, assignedSectionsArray, professorName) {
    handledSectionsContainer.innerHTML = "";

    deleteSectionFormEvent.preventDefault();
    deleteSectionFormEvent.stopPropagation();

    const sectionToBeDeleted = deleteSectionForm.section_to_be_deleted.value;

    const indexToDelete = assignedSectionsArray.indexOf(sectionToBeDeleted);
    if (indexToDelete > -1) {
        assignedSectionsArray.splice(indexToDelete, 1);
    }

    assignedSectionsArray.forEach((handledSection) => {
        const sectionContainer = createElementWithText('div', `<p>${handledSection}</p>`, 'edit-professor-modal-section');
        handledSectionsContainer.appendChild(sectionContainer);
    });

    deleteSectionForm.removeEventListener('submit', deleteSectionFormHandler);
    deleteSectionModal.style.display = "none";
}






function wakeAddSectionButton(assignedSectionsArray, professorName) {
    addHandledSectionButton.addEventListener('click', () => addHandledSectionButtonHandler(assignedSectionsArray, professorName));
}
function addHandledSectionButtonHandler(assignedSectionsArray, professorName) {
    addSectionModal.style.display = "flex";

    document.querySelector('.add-section-modal-close-container').addEventListener('click', function() {
        addSectionModal.style.display = "none";
    });

    addSectionForm.addEventListener('submit', (addSectionFormEvent) => addSectionFormHandler(addSectionFormEvent, assignedSectionsArray, professorName));

    addHandledSectionButton.removeEventListener('click', () => addHandledSectionButtonHandler(assignedSectionsArray, professorName));
    wakeAddSectionButton(assignedSectionsArray, professorName);
}
function addSectionFormHandler(addSectionFormEvent, assignedSectionsArray, professorName) {
    handledSectionsContainer.innerHTML = "";

    addSectionFormEvent.preventDefault();
    addSectionFormEvent.stopPropagation();

    const sectionToAdd = addSectionForm.section_to_add.value;

    if (!assignedSectionsArray.includes(sectionToAdd)) {
        assignedSectionsArray.push(sectionToAdd);
    } else {
        //Error message here
    }

    assignedSectionsArray.forEach((handledSection) => {
        const sectionContainer = createElementWithText('div', `<p>${handledSection}</p>` ,'edit-professor-modal-section');
        handledSectionsContainer.appendChild(sectionContainer);
    });

    deleteSectionForm.removeEventListener('submit', (addSectionFormEvent) => addSectionFormHandler(addSectionFormEvent, assignedSectionsArray, professorName));
    addSectionModal.style.display = "none";
}
//END OF PROFESSOR BLOCK 





// Add entity button logic.
function wakeAddEntityButton(from) {
    addEntityButton.addEventListener('click', () => {
        addEntityHandler(from);

        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            addEntity();
        }, 500);
    });
}
function addEntityHandler(from) {
    addEntityClicks.push(from);
}
function addEntity() {
    if (addEntityClicks[addEntityClicks.length - 1] == "professor" || addEntityClicks[addEntityClicks.length - 1] == "initialization") {
        let assignedSectionsArray = [];

        addProfessorModal.style.display = "flex";

        addProfessorForm.addEventListener('submit', (addProfessorFormHandlerEvent) => addProfessorFormHandler(addProfessorFormHandlerEvent, assignedSectionsArray), {once : true});

        // removeSectionButton.addEventListener('click', () => removeSectionButtonHandler(assignedSectionsArray), {once : true});

        wakeAssignSectionButton(assignedSectionsArray);
        wakeRemoveSectionButton(assignedSectionsArray);
        
        document.querySelector(".add-professor-modal-close-container").addEventListener("click", function () {
            addProfessorModal.style.display = "none";
        });
        
        console.log("Inside add class section");
    } else if (addEntityClicks[addEntityClicks.length - 1] == "classSection") {
        addClassSectionForm.addEventListener('submit', addClassSectionFormHandler);
        addClassSectionModal.style.display = "flex";

        console.log("Add class section modal");

        document.querySelector(".add-class-section-modal-close-container").addEventListener("click", function () {
            addClassSectionModal.style.display = "none"; 
        });
    } else if(addEntityClicks[addEntityClicks.length - 1] == "student") {
        addStudentModal.style.display = "flex";

        addStudentForm.addEventListener('submit', (addStudentFormEvent) => addStudentFormHandler(addStudentFormEvent));

        document.querySelector('.add-student-modal-close-container').addEventListener('click', function() {
            addStudentModal.style.display = "none";
        });
    } else {
        console.log("Error message here");
    }
}
//End of entity button logic


function addStudentFormHandler(addStudentFormEvent) {
    addStudentFormEvent.preventDefault();
    addStudentFormEvent.stopPropagation();

    const studentIdNumber = addStudentForm.student_id_number.value;
    const studentName =  addStudentForm.student_name.value;
    const studentEmail = addStudentForm.student_email.value;
    const studentPassword = addStudentForm.student_password.value;
    const studentSection = addStudentForm.student_section.value;

    createStudentAccount(studentIdNumber, studentName, studentEmail, studentPassword, studentSection).then((message) => {
        initializeStudentTable();
        addStudentForm.reset();
        addStudentModal.style = "none";
    });

    addStudentForm.removeEventListener('submit', (addStudentFormEvent) => addStudentFormHandler(addStudentFormEvent));
    addEntityButton.removeEventListener('click', wakeAddEntityButton);

    wakeAddEntityButton("student");
}


// Helper Function to Create an Element and Set Its Text Content
const createElementWithText = (tag, text, className) => {
    const element = document.createElement(tag);
    element.className = className;
    element.innerHTML = text;
    return element;
};
//If the logout button is insight execute the if statement.
if (logoutButton) {
    logoutButton.addEventListener('click', function () {
        signOutUser().then((homepage) => {
            window.location.href = homepage;
        });
    }, {once : true});// Automatically reset event listeners once the session ends.
}