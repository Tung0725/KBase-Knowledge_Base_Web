package com.kbase.repository;

import com.kbase.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    Optional<Project> findByInviteCode(String inviteCode);
    
    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN ProjectMember pm ON p.id = pm.project.id WHERE p.owner.id = :userId OR pm.user.id = :userId ORDER BY p.createdAt DESC")
    List<Project> findAllProjectsForUser(@Param("userId") UUID userId);

    @Query("SELECT p FROM Project p WHERE " +
           "(:isPublic IS NULL OR p.isPublic = :isPublic) " +
           "AND (:keyword = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Project> searchProjects(@Param("keyword") String keyword, @Param("isPublic") Boolean isPublic);

    @Query("SELECT p FROM Project p WHERE " +
           "(:isPublic IS NULL OR p.isPublic = :isPublic) " +
           "AND (:keyword = '' OR " +
           "LOWER(function('translate', p.name, 'áàãạảăắằẵặẳâấầẫậẩéèẽẹẻêếềễệểíìĩịỉóòõọỏôốồỗộổơớờỡợởúùũụủưứừữựửýỳỹỵỷđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyyd')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(function('translate', p.owner.email, 'áàãạảăắằẵặẳâấầẫậẩéèẽẹẻêếềễệểíìĩịỉóòõọỏôốồỗộổơớờỡợởúùũụủưứừữựửýỳỹỵỷđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyyd')) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Project> searchProjectsPaginated(@Param("keyword") String keyword, @Param("isPublic") Boolean isPublic, Pageable pageable);
}
