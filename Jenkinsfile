pipeline {
    agent any

    tools {
        nodejs 'NodeJS-24'
    }

    environment {
        DOCKER_IMAGE_PROD = 'mi-app-nestjs-prod'
        DOCKER_CONTAINER_PROD = 'nestjs_app_prod'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Run Unit Tests') {
            steps {
                echo '--- Running NestJS Tests ---'
                sh "docker build --target test -t ${DOCKER_IMAGE_PROD}-test ."
            }
        }

        stage('Deploy to Production') {
            // Este 'stage' solo se ejecuta si la rama es 'main'
            when {
                branch 'main'
            }
            steps {
                script {
                    echo '--- Deploying to Production ---'
                    
                    // 1. Construir la imagen de producción final
                    sh "docker build -t ${DOCKER_IMAGE_PROD}:${env.BUILD_ID} ."
                    sh "docker build -t ${DOCKER_IMAGE_PROD}:latest ."

                    // 2. Detener y remover el contenedor de producción antiguo
                    sh """
                    if [ \$(docker ps -a -q -f name=${DOCKER_CONTAINER_PROD}) ]; then
                        docker stop ${DOCKER_CONTAINER_PROD}
                        docker rm ${DOCKER_CONTAINER_PROD}
                    fi
                    """

                    // 3. Iniciar el nuevo contenedor de producción
                    sh """
                    docker run -d --name ${DOCKER_CONTAINER_PROD} \
                        --network=${env.JOB_NAME}_app-network \
                        -p 3000:3000 \
                        -e DATABASE_URL='postgresql://user:password@db:5432/mydatabase?schema=public' \
                        ${DOCKER_IMAGE_PROD}:latest
                    """
                }
            }
        }
    }
    post {
        always {
            sh "docker rmi ${DOCKER_IMAGE_PROD}-test || true"
            docker.image('docker:latest').inside {
                echo '--- Cleaning up unused Docker images ---'
                sh 'docker image prune -f'
            }
        }
    }
}