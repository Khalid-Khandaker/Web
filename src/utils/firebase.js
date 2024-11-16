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


//This function will add users document to users collection.
// const addUserToDB = async (uid, userType, email) => {
//     const docRef = await addDoc(collection(database, "users"), {
//         uid: uid,
//         user_type: userType,
//         username: email
//     });
//     return docRef;
// }


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
    const classSectionsCollectionReference = collection(database, "classSections");
    const classSectionQuery = query(classSectionsCollectionReference, where("name", "==", classSectionName));
    const classSectionSnapshot = await getDocs(classSectionQuery);

    const classSectionDocument = classSectionSnapshot.docs[0];     

    const studentsSubcollectionReference = collection(classSectionDocument.ref, "students");
    const studentsSnapshot = await getDocs(studentsSubcollectionReference);

    studentsSnapshot.forEach((student) => {
        const idNumber = student.data().idnumber;
        const name = student.data().name;
        assignedStudentsArray.push({name, idNumber});
    });
    
    return assignedStudentsArray;
    // Returns an array of document references matching the query
    // const sectionsReference = collection(database, "classSections");
    // const sectionsQuery = query(sectionsReference, where("name", "==", classSectionName));
    // const sectionsSnapshot = await getDocs(sectionsQuery);

    // const assignedStudentsArray = [];
    
    // if(!sectionsSnapshot.empty) {
    //     const sectionDocument = sectionsSnapshot.docs[0];
    //     const studentsSubcollectionReference = collection(sectionDocument.ref, "students");
    //     const assignedStudentsSnapshot = await getDocs(studentsSubcollectionReference);
        
    //     assignedStudentsSnapshot.forEach((students) => {
    //         assignedStudentsArray.push(students.data());
    //     });
    //     return assignedStudentsArray;
    // } else {
    //     //Throws message
    // }
}



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


//This function is used for signing out users.
export const signOutUser = async () => {
    signOut(authentication);
    return "../login.html";
}




//This function is used to create professor account and add professor document to professors collection.
export const addCreateProfessor = async (professorName, professorEmail, professorPassword, assignedSectionsArray) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(authentication, professorEmail, professorPassword);
        const user = userCredential.user;
        const professorUID = user.uid;
       
        const professorData = {
            uid: professorUID,
            name: professorName,
            userType: "professor"
        };
    
        const professorDocRef = await addDoc(collection(database, "professors"), professorData);
    
        const handledSectionsCollectionRef = collection(professorDocRef, "handledSections");
    
        if (assignedSectionsArray.length > 0) {
            for (const section of assignedSectionsArray) {
                await addDoc(handledSectionsCollectionRef, { name: section });
            }
        } else {
            await addDoc(handledSectionsCollectionRef, { placeholder: true });
        }
    
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
    const sectionDocumentReference = await addDoc(collection(database, "classSections"), {
        name: classSectionName,
        assignedTo: ""
    });
    const studentsSubcollectionReference = collection(sectionDocumentReference,"students");
    await addDoc(studentsSubcollectionReference, {
        idnumber : "202110233",
        name : "Khandaker, Khalid Uzzaman T."
    });
}



//This function is used to retrieve class section document inside classSections collection
export const getClassSectionTableDocuments = async () => {
    const classSectionCollectionReference = collection(database, "classSections");
    
    return new Promise((resolve) => {
        onSnapshot(classSectionCollectionReference, async (classSectionsSnapshot) => {
            let sectionsData = [];

            const promises = classSectionsSnapshot.docs.map(async (section) => {
                const name = section.data().name;
                const assignedTo = section.data().assignedTo;

                const studentCount = await countSubcollection(section.ref, "students");

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
        const handledSectionsSnapshot = await getDocs(handledSectionsCollection);
        
        const handledSections = handledSectionsSnapshot.docs.map(sectionDoc => sectionDoc.data());

        return {
            ...professorData,
            handledSections
        };
    }));

    return professorsData;
};




//This function is used to count the total student enrolled on a particular section.
async function countSubcollection(documentReference, subCollectionName) {
    const studentsSubcollectionReference = collection(documentReference, subCollectionName);
    const studentCountSnapshot = await getCountFromServer(studentsSubcollectionReference);
    
    return studentCountSnapshot.data().count;
}




export const getAuthentication = () => {
    return authentication;
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





//This function retrieves professor handled sections.
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




//Is this function going to delete all documents in users, and professors collection that matches professorName 
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






export const createStudentAccount = async (studentIdNumber, studentName, studentEmail, studentPassword, studentSection) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(authentication, studentEmail, studentPassword);
        const studentUID = userCredential.user.uid;

        await updateProfile(userCredential.user, { displayName: studentName });

        const studentData = {
            idNum: studentIdNumber,
            name: studentName,
            section: studentSection,
            uid: studentUID,
        };

        const studentsReference = collection(database, 'students');
        await setDoc(doc(studentsReference), studentData);

        const usersReference = collection(database, 'users');
        const userData = { ...studentData, userType: 'student' };
        await setDoc(doc(usersReference), userData);

        return `Student account created successfully for ${studentName}`;
    } catch (error) {
        console.error('Error creating student account:', error);
        return 'Error creating student account';
    }
};





export const getStudentData = async (studentId) => {
    try {
        // Query the 'students' collection where idNum matches studentId
        const studentsCollection = collection(database, 'students');
        const q = query(studentsCollection, where("idNum", "==", studentId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const studentDocument = querySnapshot.docs[0]; // Assuming idNum is unique
            const studentData = studentDocument.data();
            const { idNum, name, section} = studentData;

            // Return student data
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