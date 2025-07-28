pipeline {
    agent any

    environment {

        DOCKER_IMAGE_PROD = 'alanhedz97/budget-nest-app'
        DOCKER_CONTAINER_PROD = 'budget_app_prod'
        DOCKERHUB_CREDENTIALS_ID = 'dockerhub-credentials'
        DIGITALOCEAN_SSH_KEY_ID = 'digitalocean-ssh-key'
    }

    stages {
        
        stage('Checkout & Define Branch') {
            steps {

                checkout scm


                script {
                    
                    def currentBranch = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
                    
                    
                    echo "La rama detectada por Git es: ${currentBranch}"
                    
                    env.CURRENT_BRANCH = currentBranch
                }
            }
        }

        stage('Run Unit Tests') {
            steps {
                echo '--- Running NestJS Tests ---'
                sh "docker build --target test -t ${DOCKER_IMAGE_PROD}-test ."
            }
        }

        stage('Debug Branch Name') {
            steps {
                echo "El nombre de la rama que Jenkins detecta es: ${env.BRANCH_NAME}"
            }
        }

        //CD
        stage('Deploy to Production') {
            when {
                expression { env.CURRENT_BRANCH == 'master' }
            }
            steps {
                script {
                    echo '--- Building and Pushing Production Image ---'
                    
                    sh "docker build -t ${DOCKER_IMAGE_PROD}:latest ."
                    sh "docker build -t ${DOCKER_IMAGE_PROD}:${env.BUILD_ID} ."
                    withCredentials([usernamePassword(credentialsId: DOCKERHUB_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                    }
                    sh "docker push ${DOCKER_IMAGE_PROD}:latest"
                    sh "docker push ${DOCKER_IMAGE_PROD}:${env.BUILD_ID}"
                }
            }
        }

        stage('Deploy to DigitalOcean') {
            when {
                expression { env.CURRENT_BRANCH == 'master' }
            }
            steps {
                echo '--- Deploying to DigitalOcean Droplet ---'
                sshagent(credentials: [DIGITALOCEAN_SSH_KEY_ID]) {
                    
                    sh """
                        ssh -o StrictHostKeyChecking=no root@157.245.91.152 '
                            echo "--- Conectado al Droplet ---" &&
                            cd ~/app &&
                            echo "--- Actualizando la nueva imagen desde Docker Hub ---" &&
                            docker-compose pull &&
                            echo "--- Reiniciando el contenedor de la aplicación ---" &&
                            docker-compose up -d --no-deps nestjs-app-prod &&
                            echo "--- Limpiando imágenes antiguas ---" &&
                            docker image prune -f &&
                            echo "--- Despliegue completado ---"
                        '
                    """
                }
            }
        }
    }
    post {
        always {
            echo '--- Cleaning up ---'
            sh "docker rmi ${DOCKER_IMAGE_PROD}-test || true"
            sh "docker logout"
        }
    }
}