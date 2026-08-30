import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

// Read firebase config (we might need to check if there is a firebase config somewhere)
// Actually we can just run it in the context of the dashbourd or AL-SAEEDAH app if we use their firebase config.
