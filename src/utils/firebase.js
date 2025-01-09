const firebaseAppConfig = {
    apiKey: "AIzaSyCGAVs4Mh55FPXaaE1zIq8W84MKz4JN7C4",
    authDomain: "tutoriweb-a6edc.firebaseapp.com",
    projectId: "tutoriweb-a6edc",
    storageBucket: "tutoriweb-a6edc.appspot.com",
    messagingSenderId: "591065376755",
    appId: "1:591065376755:web:a98e19a616691bb5ce5486",
    measurementId: "G-MYGEKJLWL3",
};

import { initializeApp } from "firebase/app";

import {
    collection, getDocs, getFirestore,
    query, where, addDoc,
    getDoc, getCountFromServer, deleteDoc,
    doc, updateDoc, setDoc, DocumentReference,
    onSnapshot
} from "firebase/firestore";

import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, updateProfile
} from "firebase/auth";

const app = initializeApp(firebaseAppConfig);
const database = getFirestore(app);
const authentication = getAuth(app);

//Global variables 
let oldClassSectionNameTwo = "";//Used for renaming class section.
let assignedToVariable = "";//Used for deleting class section.
let sectionBeingDeleted = ""//Used for deleting class section.
let studentsEnrolledInSection = []; // Array to store names of students

//Create a map that will store the enrolled students name for easy lookup




//This function is used to sign in user and direct them to appropriate page.
export const signIn = async (email, password) => {
    const credentials = await signInWithEmailAndPassword(authentication, email, password);
    const uid = credentials.user.uid;
    const usersCollectionReference = collection(database, "users");
    const usersQuery = query(usersCollectionReference, where("uid", "==", uid));
    const userSnapshot = await getDocs(usersQuery);

    if (userSnapshot.docs[0].data().userType == "admin") {
        return "Admin/admin_home.html";
    } else {
        return "Teacher/teacher_home.html";
    }
}





//This function updates class section document name inside the classSections collection.(Checked)
export const updateClassSectionName = async (oldClassSectionName, newClassSectionName) => {
    const sectionsCollectionReference = collection(database, "classSections");
    const sectionsQuery = query(sectionsCollectionReference, where("name", "==", oldClassSectionName));
    
    const sectionsSnapShot = await getDocs(sectionsQuery);

    oldClassSectionNameTwo = oldClassSectionName; 

    if (sectionsSnapShot.empty) {
        throw new Error(`No document found with name: ${oldClassSectionName}`);
    }

    const documentRef = sectionsSnapShot.docs[0].ref;

    try {
        await updateDoc(documentRef, { name: newClassSectionName });
        
        return `Document name updated to ${newClassSectionName} successfully.`;
    } catch (error) {
        throw new Error(`Failed to update document: ${error.message}`);
    }
};





//This function returns all students enrolled in a specified section by accessing the students subcollection on classSections collection.(Checked)
export const getAssignedStudents = async (classSectionName) => { 
    let assignedStudentsArray = [];
    
    try {
        const classSectionsCollectionReference = collection(database, "classSections");
        const classSectionQuery = query(classSectionsCollectionReference, where("name", "==", classSectionName));
        const classSectionSnapshot = await getDocs(classSectionQuery);

        if (classSectionSnapshot.empty) {
            console.warn(`Class section "${classSectionName}" not found.`);
            return assignedStudentsArray; // Return empty array if section doesn't exist
        }

        const classSectionDocument = classSectionSnapshot.docs[0];
        const studentsSubcollectionReference = collection(classSectionDocument.ref, "students");
        const studentsSnapshot = await getDocs(studentsSubcollectionReference);

        if (studentsSnapshot.empty) {
            console.info(`No students found for section "${classSectionName}".`);
            return assignedStudentsArray; // Return empty array if no students found
        }

        studentsSnapshot.forEach((student) => {
            const idNumber = student.data().idNum;
            const name = student.data().name;
            assignedStudentsArray.push({ name, idNumber });
        });
    } catch (error) {
        console.error(`Error retrieving assigned students for "${classSectionName}":`, error);
    }
    
    return assignedStudentsArray;
};






// This function is used to delete a class section document inside the classSections collection

export const deleteSection = async (classSectionName) => {
    try {
        const sectionsCollectionReference = collection(database, "classSections");
        const sectionsQuery = query(sectionsCollectionReference, where("name", "==", classSectionName));
        const sectionsSnapShot = await getDocs(sectionsQuery);

        sectionBeingDeleted = classSectionName;

        if (sectionsSnapShot.empty) {
            throw new Error("Document not found. Deletion cannot proceed.");
        }

        // Retrieve the document's data before deleting
        const sectionDoc = sectionsSnapShot.docs[0];
        const sectionData = sectionDoc.data();

        // Assign the value of "assignedTo" to the variable
        assignedToVariable = sectionData.assignedTo || "No value assigned"; // Default if no value exists
        console.log(`AssignedTo retrieved: ${assignedToVariable}`);

        // Access the students subcollection and store student names
        const studentsSubcollectionRef = collection(sectionDoc.ref, "students");
        const studentsSnapShot = await getDocs(studentsSubcollectionRef);

        if (!studentsSnapShot.empty) {
            studentsEnrolledInSection = studentsSnapShot.docs.map(studentDoc => studentDoc.data().name);
            console.log(`Students enrolled in section "${classSectionName}":`, studentsEnrolledInSection);
        } else {
            console.log(`No students enrolled in section "${classSectionName}".`);
        }

        // Proceed with the deletion
        await deleteDoc(doc(database, "classSections", sectionDoc.id));
        console.log(`Section "${classSectionName}" deleted successfully.`);
    } catch (error) {
        console.error(`Error deleting section: ${error.message}`);
    }
};

      





//This function creates professor document inside the professors collection and creates a subcollection called handledSections.(Assumed Correct)
export const addCreateProfessor = async (professorName, professorEmail, professorPassword, assignedSectionsArray) => {
    try {
        // Validate and process assigned sections
        for (const sectionName of assignedSectionsArray) {
            const sectionQuery = query(
                collection(database, "classSections"),
                where("name", "==", sectionName)
            );
            const sectionQuerySnapshot = await getDocs(sectionQuery);

            if (sectionQuerySnapshot.empty) {
                throw new Error(`Section "${sectionName}" does not exist in the classSections collection.`);
            }

            const sectionDoc = sectionQuerySnapshot.docs[0];
            const assignedTo = sectionDoc.data().assignedTo;

            if (assignedTo && assignedTo !== "No professor assigned") {
                throw new Error(`Section "${sectionName}" is already assigned to another professor.`);
            }
        }

        // Create a professor
        const userCredential = await createUserWithEmailAndPassword(authentication, professorEmail, professorPassword);
        const user = userCredential.user;
        const professorUID = user.uid;

        const professorData = {
            uid: professorUID,
            name: professorName,
            userType: "professor"
        };

        const professorDocRef = await addDoc(collection(database, "professors"), professorData);

        if (assignedSectionsArray.length > 0) {
            const handledSectionsCollectionRef = collection(professorDocRef, "handledSections");

            for (const sectionName of assignedSectionsArray) {
                await addDoc(handledSectionsCollectionRef, { name: sectionName });

                const sectionDocQuery = query(
                    collection(database, "classSections"),
                    where("name", "==", sectionName)
                );
                const sectionDocs = await getDocs(sectionDocQuery);

                sectionDocs.forEach(async (docSnapshot) => {
                    await updateDoc(docSnapshot.ref, { assignedTo: professorName });
                });
            }
        }

        const usersDocRef = doc(database, "users", professorDocRef.id);
        await setDoc(usersDocRef, professorData);

        return "Professor created successfully";
    } catch (error) {
        console.error("Error creating professor:", error.message);
        throw new Error("Failed to create professor: " + error.message);
    }
};







//This function creates a class section document inside the classSections collection and set live listener to each class section created.
export const addSection = async (classSectionName) => {
    try {
        const classSectionsCollection = collection(database, "classSections");
        
        // Check if the class section already exists
        const sectionQuery = query(classSectionsCollection, where("name", "==", classSectionName));
        const querySnapshot = await getDocs(sectionQuery);

        if (!querySnapshot.empty) {
            throw new Error(`Class section "${classSectionName}" already exists.`);
        }

        // Add the new class section document to the "classSections" collection
        const newSectionRef = await addDoc(classSectionsCollection, {
            name: classSectionName,
            assignedTo: "No professor assigned" // Default value
        });

        console.log(`Class section "${classSectionName}" created successfully!`);

        // Attach a real-time listener to the new document
        addSectionListener(newSectionRef.id);

        return `Class section "${classSectionName}" created successfully!`;

    } catch (error) {
        console.error(`Error adding section: ${error.message}`);
        return `Error: ${error.message}`;
    }
};

// Function to listen for changes in the specific document. (Correct)
const addSectionListener = (sectionId) => {
    const sectionRef = doc(database, "classSections", sectionId);

    let previousName = null; // This will store the old section name

    // Add a real-time listener
    onSnapshot(sectionRef, async (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const currentName = data.name;

            console.log(`Detected changes in section "${currentName}".`);

            // Check if the section name has changed
            if (previousName && previousName !== currentName) {
                console.log("Section name has been renamed.");
                
                // Update users collection where the section field matches the old name
                try {
                    const usersCollection = collection(database, "users");
                    const usersQuery = query(usersCollection, where("section", "==", previousName));
                    const usersSnapshot = await getDocs(usersQuery);
            
                    if (!usersSnapshot.empty) {
                        usersSnapshot.forEach(async (userDoc) => {
                            const userRef = doc(database, "users", userDoc.id);
                            await updateDoc(userRef, { section: currentName });
                            console.log(`User "${userDoc.data().name}" section updated to "${currentName}" in the users collection.`);
                        });
                    }
                } catch (error) {
                    console.error("Error updating users collection:", error.message);
                }
                
                // Continue with the professor and student updates as in the original code
                if (data.assignedTo && data.assignedTo !== "No professor assigned") {
                    console.log(`Assigned professor: ${data.assignedTo}`);
            
                    try {
                        // Query the professors collection to get the professor document
                        const professorsCollection = collection(database, "professors");
                        const professorQuery = query(professorsCollection, where("name", "==", data.assignedTo));
                        const professorSnapshot = await getDocs(professorQuery);
            
                        if (!professorSnapshot.empty) {
                            const professorDoc = professorSnapshot.docs[0];
                            const professorRef = doc(database, "professors", professorDoc.id);
            
                            // Access the professor's handledSections subcollection
                            const handledSectionsRef = collection(professorRef, "handledSections");
                            const handledSectionQuery = query(handledSectionsRef, where("name", "==", previousName));
                            const handledSectionSnapshot = await getDocs(handledSectionQuery);
            
                            if (!handledSectionSnapshot.empty) {
                                const handledSectionDoc = handledSectionSnapshot.docs[0];
                                const handledSectionDocRef = doc(handledSectionsRef, handledSectionDoc.id);
            
                                // Update the section name in the handledSections subcollection
                                await updateDoc(handledSectionDocRef, { name: currentName });
                                console.log(`Section name updated to "${currentName}" in professor's handledSections.`);
                            }
                        }
                    } catch (error) {
                        console.error("Error updating handledSections:", error.message);
                    }
                }
            }

            // Update previousName to the current name for the next comparison
            previousName = currentName;

            // Check if students are enrolled in the section
            try {
                const studentsSubcollection = collection(sectionRef, "students");
                const studentsSnapshot = await getDocs(studentsSubcollection);
            
                if (!studentsSnapshot.empty) {
                    const studentNames = [];
                    console.log(`Students are enrolled in section "${data.name}".`);
            
                    // Update the section field for each student in the subcollection
                    for (const studentDoc of studentsSnapshot.docs) {
                        const studentRef = doc(studentsSubcollection, studentDoc.id);
                        await updateDoc(studentRef, { section: currentName });
                        console.log(`Student "${studentDoc.data().name}" section updated to "${currentName}" in the subcollection.`);
            
                        // Collect student names for updating the main students collection
                        studentNames.push(studentDoc.data().name);
                    }
            
                    // Now update the main students collection with the new section name
                    const studentsCollection = collection(database, "students");
                    for (const studentName of studentNames) {
                        const studentQuery = query(studentsCollection, where("name", "==", studentName));
                        const studentSnapshot = await getDocs(studentQuery);
            
                        if (!studentSnapshot.empty) {
                            for (const studentDoc of studentSnapshot.docs) {
                                const studentRef = doc(studentsCollection, studentDoc.id);
                                await updateDoc(studentRef, { section: currentName });
                                console.log(`Student "${studentName}" section updated to "${currentName}" in the main collection.`);
                            }
                        }
                    }
                } else {
                    console.log(`No students currently enrolled in section "${data.name}".`);
                }
            } catch (error) {
                console.error("Error updating students subcollection and main collection:", error.message);
            }

        } else {
            // Document has been deleted
            console.log(`Section document with ID "${sectionId}" has been deleted.`);
            try {
                // Handle professors if assignedToVariable is valid
                if (assignedToVariable !== "No value assigned") {
                    const professorsCollection = collection(database, "professors");
                    const professorQuery = query(professorsCollection, where("name", "==", assignedToVariable));
                    const professorSnapshot = await getDocs(professorQuery);
            
                    if (!professorSnapshot.empty) {
                        const professorDoc = professorSnapshot.docs[0];
                        const professorRef = doc(database, "professors", professorDoc.id);
                        const handledSectionsRef = collection(professorRef, "handledSections");
            
                        const handledSectionQuery = query(handledSectionsRef, where("name", "==", sectionBeingDeleted));
                        const handledSectionSnapshot = await getDocs(handledSectionQuery);
            
                        if (!handledSectionSnapshot.empty) {
                            const handledSectionDoc = handledSectionSnapshot.docs[0];
                            const handledSectionDocRef = doc(handledSectionsRef, handledSectionDoc.id);
            
                            // Delete the section from the professor's handledSections subcollection
                            await deleteDoc(handledSectionDocRef);
                            console.log(`Section "${sectionBeingDeleted}" removed from professor's handled sections.`);
                        } else {
                            console.log("No matching section found in professor's handledSections.");
                        }
                    }
                } else {
                    console.log("No professor assigned. Skipping professor handling.");
                }
            
                // Update students if studentsEnrolledInSection is not empty
                if (studentsEnrolledInSection.length > 0) {
                    for (const studentName of studentsEnrolledInSection) {
                        const studentsCollection = collection(database, "students");
                        const studentQuery = query(studentsCollection, where("name", "==", studentName));
                        const studentSnapshot = await getDocs(studentQuery);
            
                        if (!studentSnapshot.empty) {
                            for (const studentDoc of studentSnapshot.docs) {
                                const studentRef = doc(studentsCollection, studentDoc.id);
            
                                await updateDoc(studentRef, { section: "No section assigned" });
                                console.log(`Student "${studentName}" section updated to "No section assigned".`);
                            }
                        }
                    }
                } else {
                    console.log("No students enrolled. Skipping student updates.");
                }
            } catch (error) {
                console.error("Error handling section deletion:", error.message);
            }
        }
    });
};






//This function is used to retrieve class section document inside classSections collection
export const getClassSectionTableDocuments = async () => {
    const classSectionCollectionReference = collection(database, "classSections");
    
    return new Promise((resolve) => {
        onSnapshot(classSectionCollectionReference, async (classSectionsSnapshot) => {
            let sectionsData = [];

            const promises = classSectionsSnapshot.docs.map(async (section) => {
                const name = section.data().name;
                const assignedTo = section.data().assignedTo;

                // Check if the students subcollection exists and count its documents
                let studentCount = 0;
                try {
                    const studentsSubcollectionRef = collection(section.ref, "students");
                    const studentsSnapshot = await getDocs(studentsSubcollectionRef);

                    if (!studentsSnapshot.empty) {
                        studentCount = studentsSnapshot.size;
                    }
                } catch (error) {
                    console.warn(`Failed to retrieve students subcollection for section "${name}":`, error);
                }

                return { name, assignedTo, studentCount };
            });

            sectionsData = await Promise.all(promises);
            resolve(sectionsData);
        });
    });
};







//This function is used to retrieve professor documents inside professors collection.
export const getProfessorTableDocuments = async () => {
    const professorsCollection = collection(database, "professors");
    const professorsSnapshot = await getDocs(professorsCollection);
    
    const professorsData = await Promise.all(professorsSnapshot.docs.map(async (professorDoc) => {
        const professorData = professorDoc.data();
        const handledSectionsCollection = collection(professorDoc.ref, "handledSections");
        
        try {
            const handledSectionsSnapshot = await getDocs(handledSectionsCollection);
            
            // If no documents in the subcollection, set to "No Handled Sections"
            const handledSections = handledSectionsSnapshot.empty 
                ? "No Handled Sections" 
                : handledSectionsSnapshot.docs.map(sectionDoc => sectionDoc.data());

            return {
                ...professorData,
                handledSections
            };
        } catch (error) {
            // If the subcollection doesn't exist, set handledSections to "No Handled Sections"
            console.error(`Error fetching handledSections for professor ${professorData.name}:`, error.message);
            return {
                ...professorData,
                handledSections: "No Handled Sections"
            };
        }
    }));

    return professorsData;
};







//This function is used to count the total student enrolled on a particular section.
async function countSubcollection(documentReference, subCollectionName) {
    const studentsSubcollectionReference = collection(documentReference, subCollectionName);
    const studentCountSnapshot = await getCountFromServer(studentsSubcollectionReference);
    
    return studentCountSnapshot.data().count;
}






//This function adds section to already existing professor.
async function assignSection(professorDocRef, sectionName) {
    const handledSectionsCollectionRef = collection(professorDocRef, "handledSections");

    // Step 1: Check for a placeholder document
    const placeholderQuery = query(handledSectionsCollectionRef, where("placeholder", "==", true));
    const placeholderSnapshot = await getDocs(placeholderQuery);

    // Step 2: If a placeholder document exists, delete it
    if (!placeholderSnapshot.empty) {
        const placeholderDocRef = placeholderSnapshot.docs[0].ref;
        await deleteDoc(placeholderDocRef);
    }

    // Step 3: Add the new section
    await addDoc(handledSectionsCollectionRef, { name: sectionName });
}






//Returns all professor handled sections
export const getProfessorHandledSections = async (professorName) => {  
    let handledSectionsName = [];

    try {
        const professorsRef = collection(database, "professors");
        const professorQuery = query(professorsRef, where("name", "==", professorName));
        const professorSnapshot = await getDocs(professorQuery);

        if (professorSnapshot.empty) {
            throw new Error(`Professor with name ${professorName} not found`);
        }

        
        const professorDocRef = professorSnapshot.docs[0].ref;

        const handledSectionsRef = collection(professorDocRef, "handledSections");

        const handledSectionsSnapshot = await getDocs(handledSectionsRef);

        handledSectionsName = handledSectionsSnapshot.docs.map(doc => doc.data().name);

        return handledSectionsName;
    } catch (error) {
        console.error("Error fetching professor handled sections:", error);
        throw error;
    }
};






//This function updates professor handled sections.
export const updateProfessor = async (professorName, assignedSectionsArray) => {
    try {
        const professorsRef = collection(database, "professors");
        const professorQuery = query(professorsRef, where("name", "==", professorName));
        const professorSnapshot = await getDocs(professorQuery);

        if (professorSnapshot.empty) {
            throw new Error(`Professor with name ${professorName} not found.`);
        }

        const professorDocRef = professorSnapshot.docs[0].ref;
        const handledSectionsRef = collection(professorDocRef, "handledSections");

        const handledSectionsSnapshot = await getDocs(handledSectionsRef);
        const currentHandledSections = new Map();
        handledSectionsSnapshot.forEach((doc) => {
            const { name } = doc.data();
            currentHandledSections.set(name, doc.ref);
        });

        const classSectionsRef = collection(database, "classSections");
        const classSectionsSnapshot = await getDocs(classSectionsRef);
        const classSections = new Map();

        classSectionsSnapshot.forEach((doc) => {
            const { name, assignedTo } = doc.data();
            classSections.set(name, { docRef: doc.ref, assignedTo });
        });

        const sectionsToAdd = [];
        const sectionsToDelete = [];

        for (const sectionName of assignedSectionsArray) {
            const trimmedSectionName = sectionName.trim();

            if (!classSections.has(trimmedSectionName)) {
                throw new Error(`Class section "${trimmedSectionName}" not found.`);
            }

            const { assignedTo } = classSections.get(trimmedSectionName);

            if (assignedTo && assignedTo !== "No professor assigned" && assignedTo !== professorName) {
                throw new Error(`Class section "${trimmedSectionName}" is already assigned to Professor ${assignedTo}.`);
            }

            if (!currentHandledSections.has(trimmedSectionName)) {
                sectionsToAdd.push(trimmedSectionName);
            }
        }

        for (const [sectionName, sectionDocRef] of currentHandledSections.entries()) {
            if (!assignedSectionsArray.includes(sectionName)) {
                sectionsToDelete.push({ sectionName, sectionDocRef });
            }
        }

        for (const sectionName of sectionsToAdd) {
            const { docRef: classSectionDocRef } = classSections.get(sectionName);

            const newHandledSectionDocRef = doc(handledSectionsRef);
            await setDoc(newHandledSectionDocRef, { name: sectionName });
            console.log(`Added "${sectionName}" to handledSections subcollection.`);

            await updateDoc(classSectionDocRef, { assignedTo: professorName });
            console.log(`Updated classSections: Assigned "${sectionName}" to Professor ${professorName}.`);
        }

        for (const { sectionName, sectionDocRef } of sectionsToDelete) {
            const { docRef: classSectionDocRef } = classSections.get(sectionName);

            await deleteDoc(sectionDocRef);
            console.log(`Deleted "${sectionName}" from handledSections subcollection.`);

            await updateDoc(classSectionDocRef, { assignedTo: "No professor assigned" });
            console.log(`Cleared assignedTo for "${sectionName}" in classSections.`);
        }

        return "Professor's handled sections updated successfully.";
    } catch (error) {
        console.error("Error updating professor's handled sections:", error);
        throw new Error(`Failed to update professor's handled sections: ${error.message}`);
    }
};





//This function will update professor name to all related document.
export const renameProfessor = async (oldProfessorName, newProfessorName) => {
    try {
        // Query the users collection with the old professor name and update to the new name
        const usersCollection = collection(database, "users");
        const usersQuery = query(usersCollection, where("name", "==", oldProfessorName));
        const usersSnapshot = await getDocs(usersQuery);

        if (!usersSnapshot.empty) {
            usersSnapshot.forEach(async (userDoc) => {
                const userRef = doc(database, "users", userDoc.id);
                await updateDoc(userRef, { name: newProfessorName });
                console.log(`User "${oldProfessorName}" name updated to "${newProfessorName}" in the users collection.`);
            });
        }

        // Query the professors collection with the old professor name and update to the new name
        const professorsCollection = collection(database, "professors");
        const professorsQuery = query(professorsCollection, where("name", "==", oldProfessorName));
        const professorsSnapshot = await getDocs(professorsQuery);

        if (!professorsSnapshot.empty) {
            const professorDoc = professorsSnapshot.docs[0];
            const professorRef = doc(database, "professors", professorDoc.id);

            // Update the professor's name
            await updateDoc(professorRef, { name: newProfessorName });
            console.log(`Professor "${oldProfessorName}" name updated to "${newProfessorName}" in the professors collection.`);

            // Access the handledSections subcollection
            const handledSectionsRef = collection(professorRef, "handledSections");
            const handledSectionsSnapshot = await getDocs(handledSectionsRef);

            if (!handledSectionsSnapshot.empty) {
                handledSectionsSnapshot.forEach(async (sectionDoc) => {
                    const sectionName = sectionDoc.data().name;

                    // Query the classSections collection with the section name and update assignedTo to newProfessorName
                    const classSectionsCollection = collection(database, "classSections");
                    const classSectionsQuery = query(classSectionsCollection, where("name", "==", sectionName));
                    const classSectionsSnapshot = await getDocs(classSectionsQuery);

                    if (!classSectionsSnapshot.empty) {
                        classSectionsSnapshot.forEach(async (classSectionDoc) => {
                            const classSectionRef = doc(database, "classSections", classSectionDoc.id);
                            await updateDoc(classSectionRef, { assignedTo: newProfessorName });
                            console.log(`Section "${sectionName}" assignedTo updated to "${newProfessorName}" in classSections collection.`);
                        });
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error renaming professor and updating related sections:", error.message);
    }
};







//This function going to delete all professor related documents in users, and professors collection that matches professorName. 
export const deleteProfessorRecords = async (professorName) => {
    const handledSectionsNames = [];
  
    try {
      // Query 'users' collection and delete the document
      const usersQuery = query(collection(database, "users"), where("name", "==", professorName));
      const usersSnapshot = await getDocs(usersQuery);
      usersSnapshot.forEach(async (userDoc) => {
        await deleteDoc(doc(database, "users", userDoc.id));
      });
  
      // Query 'professors' collection and check for 'handledSections' subcollection
      const professorsQuery = query(collection(database, "professors"), where("name", "==", professorName));
      const professorsSnapshot = await getDocs(professorsQuery);
      for (const professorDoc of professorsSnapshot.docs) {
        const handledSectionsQuery = collection(database, `professors/${professorDoc.id}/handledSections`);
        const handledSectionsSnapshot = await getDocs(handledSectionsQuery);
  
        handledSectionsSnapshot.forEach((sectionDoc) => {
          handledSectionsNames.push(sectionDoc.data().name);
        });
  
        await deleteDoc(doc(database, "professors", professorDoc.id));
      }
  
      // Update 'classSections' collection documents
      for (const sectionName of handledSectionsNames) {
        const classSectionsQuery = query(collection(database, "classSections"), where("name", "==", sectionName));
        const classSectionsSnapshot = await getDocs(classSectionsQuery);
        classSectionsSnapshot.forEach(async (sectionDoc) => {
          await updateDoc(doc(database, "classSections", sectionDoc.id), { assignedTo: "No professor assigned" });
        });
      }
  
    } catch (error) {
      console.error("Error deleting professor records: ", error);
    }
  };






//This function returns all student data for student table.
export const getStudentTableDocuments = async () => {
    try {
        const studentsCollectionReference = collection(database, 'students');
        const studentsSnapshot = await getDocs(studentsCollectionReference);

        const studentRecords = studentsSnapshot.docs.map(doc => ({
            id: doc.id,       
            ...doc.data()      
        }));

        return studentRecords;
    } catch (error) {
        console.error('Error retrieving student records:', error);
        return [];
    }
};






//This function will create new student account.
export const createStudentAccount = async (studentIdNumber, studentName, studentEmail, studentPassword, studentSection) => {
    try {
        // Check if studentSection is empty, set default value
        if (!studentSection) {
            studentSection = "No Section Assigned";
        }

        let sectionDocRef = null;

        // Query the classSections collection only if studentSection is not "No Section Assigned"
        if (studentSection !== "No Section Assigned") {
            const sectionsRef = collection(database, 'classSections');
            const sectionQuery = query(sectionsRef, where("name", "==", studentSection));
            const sectionSnapshot = await getDocs(sectionQuery);

            if (!sectionSnapshot.empty) {
                const sectionDoc = sectionSnapshot.docs[0];
                sectionDocRef = sectionDoc.ref; // Store the section document reference

                const studentsRef = collection(sectionDocRef, "students");
                const studentsSnapshot = await getDocs(studentsRef);

                // Check if the section already has 40 students
                if (studentsSnapshot.size >= 40) {
                    throw new Error(`The section ${studentSection} already has 40 students. Cannot add more students.`);
                }
            } else {
                throw new Error(`Section ${studentSection} not found.`);
            }
        }

        // Create user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(authentication, studentEmail, studentPassword);
        const studentUID = userCredential.user.uid;

        // Update user profile with name
        await updateProfile(userCredential.user, { displayName: studentName });

        // Prepare student data
        const studentData = {
            idNum: studentIdNumber,
            name: studentName,
            section: studentSection,
            uid: studentUID,
        };

        // Insert student document into students collection
        const studentsReference = collection(database, 'students');
        await setDoc(doc(studentsReference), studentData);

        // Insert user document into users collection
        const usersReference = collection(database, 'users');
        const userData = { ...studentData, userType: 'student' };
        await setDoc(doc(usersReference), userData);

        // If section is valid, add student to the students subcollection under classSections
        if (sectionDocRef) {
            const studentsSubcollectionRef = collection(sectionDocRef, "students");
            await setDoc(doc(studentsSubcollectionRef), studentData);
        }

        return `Student account created successfully for ${studentName}`;
    } catch (error) {
        console.error('Error creating student account:', error);
        return `Error creating student account: ${error.message}`;
    }
};







//This function returns specific student data.
export const getStudentData = async (studentId) => {
    try {
        const studentsCollection = collection(database, 'students');
        const q = query(studentsCollection, where("idNum", "==", studentId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const studentDocument = querySnapshot.docs[0]; 
            const studentData = studentDocument.data();
            const { idNum, name, section} = studentData;

            const studentArray = [idNum, name, section];
            return studentArray;
        } else {
            console.log("No matching student document!");
            return null;
        }
    } catch (error) {
        console.error("Error retrieving student data:", error);
        return null;
    }
};




export const deleteStudent = async (studentId) => {
    try {
      // Step 1: Delete from 'students' collection
      const studentsQuery = query(
        collection(database, "students"),
        where("idNum", "==", studentId)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
  
      for (const studentDoc of studentsSnapshot.docs) {
        await deleteDoc(studentDoc.ref);
      }
  
      // Step 2: Delete from 'users' collection
      const usersQuery = query(
        collection(database, "users"),
        where("idNum", "==", studentId)
      );
      const usersSnapshot = await getDocs(usersQuery);
  
      for (const userDoc of usersSnapshot.docs) {
        await deleteDoc(userDoc.ref);
      }
  
      // Step 3: Check the 'section' property and delete from subcollection
      for (const studentDoc of studentsSnapshot.docs) {
        const { section } = studentDoc.data();
  
        if (section && section !== "No Section Assigned") {
          const sectionQuery = query(
            collection(database, "classSections"),
            where("name", "==", section)
          );
          const sectionSnapshot = await getDocs(sectionQuery);
  
          for (const sectionDoc of sectionSnapshot.docs) {
            const studentsSubCollection = collection(sectionDoc.ref, "students");
            const sectionStudentsQuery = query(
              studentsSubCollection,
              where("idNum", "==", studentId)
            );
            const sectionStudentsSnapshot = await getDocs(sectionStudentsQuery);
  
            for (const sectionStudentDoc of sectionStudentsSnapshot.docs) {
              await deleteDoc(sectionStudentDoc.ref);
            }
          }
        }
      }
  
      console.log(`Student with ID ${studentId} deleted successfully.`);
    } catch (error) {
      throw new Error(error.message);
    }
  };





  export const updateStudentCredentials = async (studentIdNumber, studentName, studentSection) => {
    try {
      // Query the 'students' collection using studentIdNumber
      const studentsQuery = query(
        collection(database, "students"),
        where("idNum", "==", studentIdNumber)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
  
      if (studentsSnapshot.empty) {
        throw new Error("Student not found.");
      }
  
      const studentDoc = studentsSnapshot.docs[0];
      const studentData = studentDoc.data();
      const updatedFields = {};
  
      // Check if studentName is not empty and update
      if (studentName && studentName !== studentData.name) {
        updatedFields.name = studentName;
  
        // Update the student's name in the 'users' collection
        const usersQuery = query(
          collection(database, "users"),
          where("idNum", "==", studentIdNumber)
        );
        const usersSnapshot = await getDocs(usersQuery);
  
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          await updateDoc(userDoc.ref, { name: studentName });
          console.log(`Updated name in users collection for ID ${studentIdNumber}`);
        }
  
        // Update the student's name in the subcollection of their current section
        if (studentData.section && studentData.section !== "No Section Assigned") {
          const currentSectionQuery = query(
            collection(database, "classSections"),
            where("name", "==", studentData.section)
          );
          const currentSectionSnapshot = await getDocs(currentSectionQuery);
  
          if (!currentSectionSnapshot.empty) {
            const currentSectionDoc = currentSectionSnapshot.docs[0];
            const currentSubcollectionRef = collection(
              currentSectionDoc.ref,
              "students"
            );
  
            const studentInCurrentSectionQuery = query(
              currentSubcollectionRef,
              where("idNum", "==", studentIdNumber)
            );
            const studentInCurrentSectionSnapshot = await getDocs(
              studentInCurrentSectionQuery
            );
  
            if (!studentInCurrentSectionSnapshot.empty) {
              await updateDoc(
                studentInCurrentSectionSnapshot.docs[0].ref,
                { name: studentName }
              );
              console.log(`Updated name in current section: ${studentData.section}`);
            }
          }
        }
      }
  
      // Check if studentSection is not empty and needs updating
      if (studentSection && studentSection !== studentData.section) {
        // Query the 'classSections' collection using the new section name
        const sectionQuery = query(
          collection(database, "classSections"),
          where("name", "==", studentSection)
        );
        const sectionSnapshot = await getDocs(sectionQuery);
  
        if (sectionSnapshot.empty) {
          throw new Error(`Section ${studentSection} does not exist.`);
        }
  
        const sectionDoc = sectionSnapshot.docs[0];
        const studentsSubcollectionRef = collection(sectionDoc.ref, "students");
  
        // Count the number of documents in the 'students' subcollection
        const studentsInSectionSnapshot = await getDocs(studentsSubcollectionRef);
        const studentCount = studentsInSectionSnapshot.size;
  
        if (studentCount >= 40) {
          throw new Error("Section already full.");
        }
  
        // Add the student to the new section's subcollection (create it if it doesn't exist)
        await addDoc(studentsSubcollectionRef, {
          idNum: studentIdNumber,
          name: studentName || studentData.name,
          section: studentSection,
          uid: studentData.uid,
        });
  
        console.log(`Student added to new section: ${studentSection}`);
  
        // Update the 'section' in the 'students' collection
        updatedFields.section = studentSection;
  
        // Update the 'section' in the 'users' collection
        const usersQuery = query(
          collection(database, "users"),
          where("idNum", "==", studentIdNumber)
        );
        const usersSnapshot = await getDocs(usersQuery);
  
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          await updateDoc(userDoc.ref, { section: studentSection });
          console.log(`Updated section in users collection for ID ${studentIdNumber}`);
        }
  
        // If the student had a previous section and it wasn't "No Section Assigned"
        if (studentData.section && studentData.section !== "No Section Assigned") {
          const previousSectionQuery = query(
            collection(database, "classSections"),
            where("name", "==", studentData.section)
          );
          const previousSectionSnapshot = await getDocs(previousSectionQuery);
  
          if (!previousSectionSnapshot.empty) {
            const previousSectionDoc = previousSectionSnapshot.docs[0];
            const previousSubcollectionRef = collection(
              previousSectionDoc.ref,
              "students"
            );
  
            const studentInPreviousSectionQuery = query(
              previousSubcollectionRef,
              where("idNum", "==", studentIdNumber)
            );
            const studentInPreviousSectionSnapshot = await getDocs(
              studentInPreviousSectionQuery
            );
  
            if (!studentInPreviousSectionSnapshot.empty) {
              await deleteDoc(studentInPreviousSectionSnapshot.docs[0].ref);
              console.log(
                `Student removed from previous section: ${studentData.section}`
              );
            }
          }
        }
      }
  
      // If there are fields to update, proceed with updating the student document
      if (Object.keys(updatedFields).length > 0) {
        await updateDoc(studentDoc.ref, updatedFields);
        console.log(`Student with ID ${studentIdNumber} updated successfully.`);
      } else {
        console.log("No fields provided for update.");
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };



export const getAuthentication = () => {
    return authentication;
}
//This function is used for signing out users.
export const signOutUser = async () => {
    signOut(authentication);
    return "../login.html";
}





// const listenForSectionNameChange = (sectionDocRef, studentData) => {
//     const unsubscribe = onSnapshot(sectionDocRef, async (docSnapshot) => {
//         const sectionData = docSnapshot.data();

//         // Only update if the section name is different from the current student's section
//         if (sectionData.name !== studentData.section) {
//             console.log(`Section name changed for student ${studentData.name} from ${studentData.section} to ${sectionData.name}`);

//             // Update the section for the student in the students collection
//             const studentsRef = collection(database, 'students');
//             const studentQuery = query(studentsRef, where("uid", "==", studentData.uid));
//             const studentSnapshot = await getDocs(studentQuery);

//             studentSnapshot.forEach(async (studentDoc) => {
//                 const studentDocRef = studentDoc.ref;

//                 // Only update if the section has actually changed
//                 if (studentDoc.data().section !== sectionData.name) {
//                     const updatedData = { ...studentDoc.data(), section: sectionData.name };

//                     // Update the student's section in the main students collection
//                     await updateDoc(studentDocRef, { section: sectionData.name });
//                     console.log(`Updated section for student ${studentData.name} to ${sectionData.name}`);

//                     // If the student is in the section's "students" subcollection, update the student's section there as well
//                     const studentsSubcollectionRef = collection(docSnapshot.ref, "students");
//                     const studentSubDoc = doc(studentsSubcollectionRef, studentData.uid);
//                     await setDoc(studentSubDoc, updatedData);
//                     console.log(`Updated student's section in subcollection for section ${sectionData.name}`);
//                 }
//             });
//         }
//     });

//     // Return unsubscribe function to stop listening
//     return unsubscribe;
// };


//Take note:
//Student ID number is not editable. It must be correct from the beginning. 
//Upon student creation, student email number and student id number must match.