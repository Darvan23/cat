// Paws & Pennies — main: boots the game once every module has loaded
// Classic script: shares globals with the others; load order matters (see index.html).

buildWorld();
buildInterior();
buildHomeFamily();
buildShopInterior();
buildShelterInterior();
buildBoughtHome();
buildUpstairs();
buildExteriorUpgrades();
if (typeof spawnEmployers === 'function') spawnEmployers();   // shop owners hiring a cashier
if (typeof buildSchoolhouse === 'function') buildSchoolhouse();   // 🏫 the Town School (study skills)
applyHouseLevel(0);
bootGame();      // resume a saved game, or show the shelter to start fresh
animate();
