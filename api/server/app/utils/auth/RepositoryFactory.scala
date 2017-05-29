package utils.auth

import javax.inject.Inject

import com.mohiva.play.silhouette.api.actions.SecuredRequest
import models.document.Repository
import models.document.http.{ Auth, HttpRepository }
import play.api.libs.ws.WSClient

trait RepositoryFactory {
  /**
   * Get a repository to access the database from a provided session
   */
  def fromSession[A](request: SecuredRequest[DefaultEnv, A]): Repository

  /**
   * Get a repository with admin access
   */
  def forAdministrator: Repository
}

class HttpRepositoryFactory @Inject() (implicit ws: WSClient) extends RepositoryFactory {
  override def fromSession[A](request: SecuredRequest[DefaultEnv, A]): Repository =
    HttpRepository(request.cookies.get("SyncGatewaySession").get.value)

  private val admin = HttpRepository(Auth("system", "superSecretPassword"))

  override def forAdministrator: Repository = admin
}