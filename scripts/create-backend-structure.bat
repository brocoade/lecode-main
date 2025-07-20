@echo off

mkdir backend
mkdir backend\config
mkdir backend\services
mkdir backend\models
mkdir backend\controllers
mkdir backend\types

type nul > backend\config\firebase.config.ts
type nul > backend\services\auth.service.ts
type nul > backend\services\quiz.service.ts
type nul > backend\models\user.model.ts
type nul > backend\models\quiz.model.ts
type nul > backend\controllers\auth.controller.ts
type nul > backend\controllers\quiz.controller.ts
type nul > backend\types\auth.types.ts
type nul > backend\types\quiz.types.ts

echo Structure backend créée avec succès !
pause 