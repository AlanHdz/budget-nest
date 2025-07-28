pipeline {
    agent any

    environment {
        DOCKER_IMAGE_PROD = 'budget-nest-budget-app'
        DOCKER_CONTAINER_PROD = 'budget_app_prod'
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
                branch 'master'
            }
            steps {
                script {
                    echo '--- Deploying to Production ---'
                    
                    sh "docker build -t ${DOCKER_IMAGE_PROD}:latest ."


                     sh """
                        if [ \$(docker ps -a -q -f name=${DOCKER_CONTAINER_PROD}) ]; then
                            docker stop ${DOCKER_CONTAINER_PROD}
                            docker rm ${DOCKER_CONTAINER_PROD}
                        fi
                    """

                    sh """
                    docker run -d --name ${DOCKER_CONTAINER_PROD} \
                        --network=budget-pipeline_app-network \
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
            echo '--- Cleaning up ---'
            sh "docker rmi ${DOCKER_IMAGE_PROD}-test || true"
            sh 'docker image prune -f'
        }
    }
}