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






//This function is used to update class section name inside class sections collection.
export const updateClassSectionName = async (oldClassSectionName, newClassSectionName) => {
    const sectionsCollectionReference = collection(database, "classSections");
    const sectionsQuery = query(sectionsCollectionReference, where("name", "==", oldClassSectionName));
    
    const sectionsSnapShot = await getDocs(sectionsQuery);

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






//Pwede na pag isahin sa isang function
//Subscribe snapshot to students subcollection and return their data
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







//This function is used to delete class section document inside classSections collection
export const deleteSection = async (classSectionName) => {
    const sectionsCollectionReference = collection(database, "classSections");
    const sectionsQuery = query(sectionsCollectionReference, where("name", "==", classSectionName));
    const sectionsSnapShot = await getDocs(sectionsQuery);
    
    if (sectionsSnapShot.empty) {
        throw new Error("Document not found. Deletion cannot proceed.");
    }

    await deleteDoc(doc(database, "classSections", sectionsSnapShot.docs[0].id));

    return "Document deleted successfully";
};      






//This function is used to create professor account and add professor document to professors collection.
export const addCreateProfessor = async (professorName, professorEmail, professorPassword, assignedSectionsArray) => {
    try {
        // Ensure all sections are valid before proceeding to professor creation
        for (const sectionName of assignedSectionsArray) {
            // Check if the section exists in the classSections collection
            const sectionQuery = query(
                collection(database, "classSections"),
                where("name", "==", sectionName)
            );
            const sectionQuerySnapshot = await getDocs(sectionQuery);

            if (sectionQuerySnapshot.empty) {
                // If the section does not exist, throw an error and stop
                throw new Error(`Section "${sectionName}" does not exist in the classSections collection.`);
            }

            // Check if the section is already assigned
            const sectionDoc = sectionQuerySnapshot.docs[0];
            const assignedTo = sectionDoc.data().assignedTo;

            if (assignedTo && assignedTo !== "No professor assigned") {
                // If the section is already assigned to someone else, throw an error
                throw new Error(`Section "${sectionName}" is already assigned to another professor.`);
            }
        }

        // Create the professor only if all section checks pass
        const userCredential = await createUserWithEmailAndPassword(authentication, professorEmail, professorPassword);
        const user = userCredential.user;
        const professorUID = user.uid;

        const professorData = {
            uid: professorUID,
            name: professorName,
            userType: "professor"
        };

        // Add professor document in the professors collection
        const professorDocRef = await addDoc(collection(database, "professors"), professorData);

        // Only assign sections if assignedSectionsArray is not empty
        if (assignedSectionsArray.length > 0) {
            // Reference to the handledSections subcollection
            const handledSectionsCollectionRef = collection(professorDocRef, "handledSections");

            for (const sectionName of assignedSectionsArray) {
                // Add each section to the handledSections subcollection
                await addDoc(handledSectionsCollectionRef, { name: sectionName });

                // Update the assignedTo field in the classSections collection
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

        // Add professor to the users collection
        const usersDocRef = doc(database, "users", professorDocRef.id);
        await setDoc(usersDocRef, professorData);

        return "Professor created successfully";
    } catch (error) {
        console.error("Error creating professor:", error.message);
        throw new Error("Failed to create professor: " + error.message);
    }
};














//This function is used for adding class section document inside classSections collection.
export const addSection = async (classSectionName) => {
    try {
        const classSectionsCollection = collection(database, "classSections");
        const sectionQuery = query(classSectionsCollection, where("name", "==", classSectionName));
        const querySnapshot = await getDocs(sectionQuery);

        // Check if the class section already exists
        if (!querySnapshot.empty) {
            throw new Error(`Class section "${classSectionName}" already exists.`);
        }

        // Add the new class section document to the "classSections" collection
        await addDoc(classSectionsCollection, {
            name: classSectionName,
            assignedTo: "No professor assigned"
        });

        return `Class section "${classSectionName}" created successfully!`;
    } catch (error) {
        console.error(`Error adding section: ${error.message}`);
        return `Error: ${error.message}`;
    }
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






//This function retrieves all professor handled sections.
export const updateProfessorHandledSections = async (professorName, assignedSectionsArray) => {
    try {
        const professorsRef = collection(database, "professors");
        const professorQuery = query(professorsRef, where("name", "==", professorName));
        const professorSnapshot = await getDocs(professorQuery);

        if (professorSnapshot.empty) {
            throw new Error(`Professor with name ${professorName} not found`);
        }

        const professorDocRef = professorSnapshot.docs[0].ref;
        const handledSectionsRef = collection(professorDocRef, "handledSections");

        const currentSectionsSnapshot = await getDocs(handledSectionsRef);
        const currentSections = new Map();
        
        currentSectionsSnapshot.forEach((doc) => {
            const sectionName = doc.data().name;
            currentSections.set(sectionName, doc.ref);
        });

        for (const sectionName of assignedSectionsArray) {
            const trimmedSectionName = sectionName;

            if (!currentSections.has(trimmedSectionName)) {
                const newSectionDocRef = doc(handledSectionsRef);
                await setDoc(newSectionDocRef, { name: trimmedSectionName });
                console.log(`Added new section: ${trimmedSectionName}`);
            }
        }

        for (const [sectionName, sectionDocRef] of currentSections.entries()) {
            if (!assignedSectionsArray.some(section => section === sectionName)) {
                await deleteDoc(sectionDocRef);
                console.log(`Deleted section: ${sectionName}`);
            }
        }

        return "Handled sections updated successfully";
    } catch (error) {
        console.error("Error updating professor's handled sections:", error);
        return "Error updating professor's handled sections";
    }
};
//Check if assigneddSectionsArray contains a section that is already assignedTo another professor under classSections collection if yes throw an error, 
//check if assignedSectionsArray contains a section that is not existing in classSections collection if yes throw an error, if all sections inside the assignedSectionsArray are not taken and existing create a document inside the
//classSectionsCollection and set the assignedTo property value to this professorName.
//If the section is deleted in assignedSectionsArray remove the name of the professor on the assignedTo property of that section document inside the classSection 






//This function going to delete all documents in users, and professors collection that matches professorName 
export const deleteProfessor = async (professorName) => {
    try {
        const professorsRef = collection(database, "professors");
        const professorQuery = query(professorsRef, where("name", "==", professorName));
        const professorSnapshot = await getDocs(professorQuery);
    
        if (professorSnapshot.empty) {
            return "Professor not found in professors collection.";
        }
        
        const professorDoc = professorSnapshot.docs[0];
        const professorData = professorDoc.data();
        const professorUID = professorData.uid;
    
        await deleteDoc(professorDoc.ref);
        let message = "Deleted professor document from professors collection for.";
    
        const usersRef = collection(database, "users");
        const userQuery = query(usersRef, where("uid", "==", professorUID));
        const userSnapshot = await getDocs(userQuery);
    
        if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            await deleteDoc(userDoc.ref);
            message += "Deleted user document from users collection for. ";
        } else {
            message += "User document for UID not found in users collection. ";
        }
    
        const user = await authentication.getUser(professorUID);
        await deleteUser(user);
        message += "Deleted Firebase Authentication account for.";
    
        return message;
        
    } catch (error) {
        return "Error deleting professor";
    }
} 






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
}






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





export const getAuthentication = () => {
    return authentication;
}
//This function is used for signing out users.
export const signOutUser = async () => {
    signOut(authentication);
    return "../login.html";
}